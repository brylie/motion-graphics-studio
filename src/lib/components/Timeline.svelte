<!--
  Timeline Component with Canvas-based Rendering
  
  Features:
  - Drag clips to reposition
  - Resize clips from left/right edges
  - Click keyframes to select, drag to reposition
  - Delete key removes selected keyframe or clip
  - Scrub timeline by dragging in ruler
  - Spacebar to play/pause
  
  Automation Modes (when resizing clips):
  - ABSOLUTE MODE (default): Keyframes stay at fixed times, clip resize constrained to keyframe bounds
  - PROPORTIONAL MODE (hold Alt/Option): Keyframes scale proportionally with clip duration (time-stretch)
-->
<script lang="ts">
  import { onMount } from "svelte";
  import {
    timeline,
    timelineView,
    timelineActions,
    viewActions,
  } from "$lib/stores/timeline";
  import { playback, playbackActions } from "$lib/stores/playback";
  import type { Clip, Track } from "$lib/timeline/types";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let width = 1200;
  let height = 400;

  // Constants
  const TRACK_HEIGHT = 60;
  const AUTOMATION_LANE_HEIGHT = 40;
  const TRACK_MARGIN = 5;
  const RULER_HEIGHT = 30;
  const HANDLE_WIDTH = 8;
  const MIN_CLIP_WIDTH = 20;
  const KEYFRAME_SIZE = 8;

  // Interaction state
  let isDragging = false;
  let isResizing = false;
  let isScrubbing = false;
  let isDraggingKeyframe = false;
  let resizeHandle: "left" | "right" | null = null;
  let dragStartX = 0;
  let dragStartTime = 0;
  let draggedClip: Clip | null = null;
  let draggedTrackIndex = -1;
  let originalClipDuration = 0; // For proportional keyframe scaling
  let originalClipStartTime = 0; // Original start time for resize
  let originalKeyframes: Array<{ curve: string; time: number; value: number }> =
    []; // Original keyframe positions
  let altKeyPressed = false; // Track Alt/Option key state
  let hoveredClip: { clip: Clip; trackIndex: number } | null = null;
  let isDraggingOver = false;
  let dropTargetTrack = -1;
  let hoveredParameter: { clipId: string; paramName: string } | null = null;

  // Use selectedKeyframe from store
  $: selectedKeyframe = $timelineView.selectedKeyframe;

  // Helper functions
  function timeToX(time: number): number {
    return time * $timelineView.pixelsPerSecond - $timelineView.scrollX;
  }

  function xToTime(x: number): number {
    return (x + $timelineView.scrollX) / $timelineView.pixelsPerSecond;
  }

  function trackIndexToY(trackIndex: number): number {
    let y = RULER_HEIGHT;
    for (let i = 0; i < trackIndex; i++) {
      y += getTrackHeight(i) + TRACK_MARGIN;
    }
    return y;
  }

  function getTrackHeight(trackIndex: number): number {
    let height = TRACK_HEIGHT;
    const track = $timeline.tracks[trackIndex];
    if (!track) return height;

    // Add height for automation lanes (only for parameters with keyframes)
    for (const clip of track.clips) {
      const automationCount = clip.automation.filter(
        (c) => c.keyframes.length > 0
      ).length;
      height += automationCount * AUTOMATION_LANE_HEIGHT;
    }
    return height;
  }

  function yToTrackIndex(y: number): number {
    if (y < RULER_HEIGHT) return -1;

    let currentY = RULER_HEIGHT;
    for (let i = 0; i < $timeline.tracks.length; i++) {
      const trackHeight = getTrackHeight(i);
      if (y >= currentY && y < currentY + trackHeight) {
        return i;
      }
      currentY += trackHeight + TRACK_MARGIN;
    }
    return -1;
  }

  function getClipAtPosition(
    x: number,
    y: number
  ): { clip: Clip; trackIndex: number } | null {
    const time = xToTime(x);
    const trackIndex = yToTrackIndex(y);

    if (trackIndex < 0 || trackIndex >= $timeline.tracks.length) return null;

    const track = $timeline.tracks[trackIndex];
    const clip = track.clips.find((c) => {
      return time >= c.startTime && time <= c.startTime + c.duration;
    });

    return clip ? { clip, trackIndex } : null;
  }

  function getResizeHandle(
    clip: Clip,
    trackIndex: number,
    x: number,
    y: number
  ): "left" | "right" | null {
    const clipX = timeToX(clip.startTime);
    const clipY = trackIndexToY(trackIndex);
    const clipWidth = clip.duration * $timelineView.pixelsPerSecond;

    if (y < clipY || y > clipY + TRACK_HEIGHT) return null;

    if (Math.abs(x - clipX) < HANDLE_WIDTH) return "left";
    if (Math.abs(x - (clipX + clipWidth)) < HANDLE_WIDTH) return "right";

    return null;
  }

  function snapTime(time: number, gridSize: number = 0.1): number {
    return Math.round(time / gridSize) * gridSize;
  }

  function getKeyframeAtPosition(
    x: number,
    y: number
  ): { clip: Clip; paramName: string; keyframeTime: number } | null {
    const time = xToTime(x);

    for (
      let trackIndex = 0;
      trackIndex < $timeline.tracks.length;
      trackIndex++
    ) {
      const track = $timeline.tracks[trackIndex];
      const trackY = trackIndexToY(trackIndex);

      for (const clip of track.clips) {
        const clipX = timeToX(clip.startTime);
        const clipWidth = clip.duration * $timelineView.pixelsPerSecond;

        // Skip if not in this clip's time range
        if (x < clipX || x > clipX + clipWidth) continue;

        let laneY = trackY + TRACK_HEIGHT;

        // Check each automation lane
        for (const curve of clip.automation) {
          if (curve.keyframes.length === 0) continue;

          // Check if y is in this lane
          if (y >= laneY && y < laneY + AUTOMATION_LANE_HEIGHT) {
            // Check each keyframe
            for (const keyframe of curve.keyframes) {
              const kfX = clipX + keyframe.time * $timelineView.pixelsPerSecond;

              // Hit test with some tolerance
              if (Math.abs(x - kfX) < KEYFRAME_SIZE) {
                return {
                  clip,
                  paramName: curve.parameterName,
                  keyframeTime: keyframe.time,
                };
              }
            }
          }

          laneY += AUTOMATION_LANE_HEIGHT;
        }
      }
    }

    return null;
  }

  // Drawing functions
  function drawRuler() {
    if (!ctx) return;

    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(0, 0, width, RULER_HEIGHT);

    // Draw time markers
    const startTime = xToTime(0);
    const endTime = xToTime(width);
    const step = $timelineView.pixelsPerSecond > 50 ? 1 : 5; // 1 second or 5 seconds

    ctx.strokeStyle = "#555";
    ctx.fillStyle = "#ccc";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";

    for (let t = Math.floor(startTime); t <= Math.ceil(endTime); t += step) {
      const x = timeToX(t);
      if (x < 0 || x > width) continue;

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT - 10);
      ctx.lineTo(x, RULER_HEIGHT);
      ctx.stroke();

      // Draw label
      ctx.fillText(`${t}s`, x, RULER_HEIGHT - 15);
    }

    // Draw grid lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let t = Math.floor(startTime); t <= Math.ceil(endTime); t += step) {
      const x = timeToX(t);
      if (x < 0 || x > width) continue;

      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  function drawTracks() {
    if (!ctx) return;

    $timeline.tracks.forEach((track, index) => {
      const y = trackIndexToY(index);

      // Draw track background
      const isSelected = $timelineView.selectedTrackId === track.id;
      const isDropTarget = isDraggingOver && dropTargetTrack === index;

      if (isDropTarget) {
        ctx!.fillStyle = "#3a5a7a";
      } else if (isSelected) {
        ctx!.fillStyle = "#2a2a2a";
      } else {
        ctx!.fillStyle = "#1e1e1e";
      }
      ctx!.fillRect(0, y, width, TRACK_HEIGHT);

      // Draw track border
      ctx!.strokeStyle = isDropTarget ? "#6a9fc7" : "#444";
      ctx!.lineWidth = isDropTarget ? 2 : 1;
      ctx!.strokeRect(0, y, width, TRACK_HEIGHT);

      // Draw track label
      ctx!.fillStyle = track.muted ? "#666" : "#aaa";
      ctx!.font = "12px sans-serif";
      ctx!.textAlign = "left";
      ctx!.fillText(`Track ${index + 1}`, 5, y + 15);
      if (track.solo) {
        ctx!.fillStyle = "#ff0";
        ctx!.fillText("S", 65, y + 15);
      }
      if (track.muted) {
        ctx!.fillStyle = "#f00";
        ctx!.fillText("M", 80, y + 15);
      }
    });
  }

  function drawClips() {
    if (!ctx) return;

    $timeline.tracks.forEach((track, trackIndex) => {
      const y = trackIndexToY(trackIndex);

      track.clips.forEach((clip) => {
        const x = timeToX(clip.startTime);
        const clipWidth = Math.max(
          MIN_CLIP_WIDTH,
          clip.duration * $timelineView.pixelsPerSecond
        );

        // Skip if out of view
        if (x + clipWidth < 0 || x > width) return;

        // Determine clip color
        const isSelected = $timelineView.selectedClipId === clip.id;
        const isHovered = hoveredClip?.clip.id === clip.id;

        let fillColor = "#4a7ba7";
        if (isSelected) fillColor = "#6a9fc7";
        if (isHovered) fillColor = "#5a8bb7";

        // Draw clip body
        ctx!.fillStyle = fillColor;
        ctx!.fillRect(x, y + 2, clipWidth, TRACK_HEIGHT - 4);

        // Draw clip border
        ctx!.strokeStyle = isSelected ? "#8ac9ff" : "#7a9fb7";
        ctx!.lineWidth = isSelected ? 2 : 1;
        ctx!.strokeRect(x, y + 2, clipWidth, TRACK_HEIGHT - 4);

        // Draw resize handles
        if (isSelected || isHovered) {
          ctx!.fillStyle = "#fff";
          ctx!.fillRect(x, y + 2, HANDLE_WIDTH, TRACK_HEIGHT - 4);
          ctx!.fillRect(
            x + clipWidth - HANDLE_WIDTH,
            y + 2,
            HANDLE_WIDTH,
            TRACK_HEIGHT - 4
          );
        }

        // Draw clip label
        ctx!.fillStyle = "#fff";
        ctx!.font = "11px sans-serif";
        ctx!.textAlign = "left";
        const label = clip.shaderId || "Clip";
        ctx!.save();
        ctx!.beginPath();
        ctx!.rect(x + 2, y + 2, clipWidth - 4, TRACK_HEIGHT - 4);
        ctx!.clip();
        ctx!.fillText(label, x + 10, y + 20);
        ctx!.restore();

        // Draw duration
        ctx!.fillStyle = "#ccc";
        ctx!.font = "10px monospace";
        ctx!.fillText(`${clip.duration.toFixed(1)}s`, x + 10, y + 35);

        // Draw automation lanes for parameters with keyframes
        let laneY = y + TRACK_HEIGHT;
        clip.automation.forEach((curve) => {
          if (curve.keyframes.length > 0) {
            drawAutomationLane(clip, curve.parameterName, x, laneY, clipWidth);
            laneY += AUTOMATION_LANE_HEIGHT;
          }
        });
      });
    });
  }

  function drawAutomationLane(
    clip: Clip,
    paramName: string,
    clipX: number,
    laneY: number,
    clipWidth: number
  ) {
    if (!ctx) return;

    // Lane background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(clipX, laneY, clipWidth, AUTOMATION_LANE_HEIGHT);

    // Lane border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(clipX, laneY, clipWidth, AUTOMATION_LANE_HEIGHT);

    // Parameter name
    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(paramName, clipX + 5, laneY + 12);

    // Find automation curve
    const curve = clip.automation.find((c) => c.parameterName === paramName);
    if (!curve || curve.keyframes.length === 0) return;

    // Draw curve line
    ctx.strokeStyle = "#4a9eff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const minValue = 0;
    const maxValue = 1; // Assume 0-1 range for now
    const laneHeight = AUTOMATION_LANE_HEIGHT - 4;

    curve.keyframes.forEach((keyframe, i) => {
      const kfX = clipX + keyframe.time * $timelineView.pixelsPerSecond;
      const normalizedValue =
        (keyframe.value - minValue) / (maxValue - minValue);
      const kfY = laneY + laneHeight - normalizedValue * laneHeight + 2;

      if (i === 0) {
        ctx!.moveTo(kfX, kfY);
      } else {
        ctx!.lineTo(kfX, kfY);
      }
    });
    ctx.stroke();

    // Draw keyframe diamonds
    curve.keyframes.forEach((keyframe) => {
      const kfX = clipX + keyframe.time * $timelineView.pixelsPerSecond;
      const normalizedValue =
        (keyframe.value - minValue) / (maxValue - minValue);
      const kfY = laneY + laneHeight - normalizedValue * laneHeight + 2;

      // Check if this keyframe is selected
      const isSelected =
        selectedKeyframe &&
        selectedKeyframe.clipId === clip.id &&
        selectedKeyframe.paramName === paramName &&
        Math.abs(selectedKeyframe.time - keyframe.time) < 0.01;

      ctx!.save();
      ctx!.translate(kfX, kfY);
      ctx!.rotate(Math.PI / 4);
      ctx!.fillStyle = isSelected ? "#ff9933" : "#4a9eff";
      ctx!.fillRect(
        -KEYFRAME_SIZE / 2,
        -KEYFRAME_SIZE / 2,
        KEYFRAME_SIZE,
        KEYFRAME_SIZE
      );
      ctx!.strokeStyle = isSelected ? "#ffcc00" : "#fff";
      ctx!.lineWidth = isSelected ? 2 : 1;
      ctx!.strokeRect(
        -KEYFRAME_SIZE / 2,
        -KEYFRAME_SIZE / 2,
        KEYFRAME_SIZE,
        KEYFRAME_SIZE
      );
      ctx!.restore();
    });
  }

  function drawPlayhead() {
    if (!ctx) return;

    const x = timeToX($playback.currentTime);

    // Draw playhead line
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Draw playhead triangle
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x - 6, RULER_HEIGHT - 10);
    ctx.lineTo(x + 6, RULER_HEIGHT - 10);
    ctx.closePath();
    ctx.fill();
  }

  function drawModeIndicator(proportionalMode: boolean) {
    if (!ctx || !isResizing) return;

    // Draw mode indicator in top right
    const text = proportionalMode ? "PROPORTIONAL MODE (Alt)" : "ABSOLUTE MODE";
    ctx.font = "12px monospace";
    ctx.textAlign = "right";

    // Background
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = proportionalMode
      ? "rgba(255, 150, 0, 0.9)"
      : "rgba(100, 150, 255, 0.9)";
    ctx.fillRect(width - textWidth - 20, 5, textWidth + 15, 20);

    // Text
    ctx.fillStyle = "#fff";
    ctx.fillText(text, width - 10, 19);
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    drawRuler();
    drawTracks();
    drawClips();
    drawPlayhead();
    drawModeIndicator(altKeyPressed);
  }

  // Event handlers
  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking in ruler - start scrubbing
    if (y < RULER_HEIGHT) {
      const clickTime = xToTime(x);
      playbackActions.seek(clickTime);
      isScrubbing = true;
      return;
    }

    // Check for keyframe interaction first
    const keyframeAtPos = getKeyframeAtPosition(x, y);
    if (keyframeAtPos) {
      viewActions.selectKeyframe(
        keyframeAtPos.clip.id,
        keyframeAtPos.paramName,
        keyframeAtPos.keyframeTime
      );
      isDraggingKeyframe = true;
      dragStartX = x;
      dragStartTime = keyframeAtPos.keyframeTime;
      viewActions.selectClip(keyframeAtPos.clip.id);
      render();
      return;
    }

    // Clear keyframe selection if clicking elsewhere
    viewActions.selectKeyframe(null, null, null);

    // Check for clip interaction
    const clipAtPos = getClipAtPosition(x, y);
    if (clipAtPos) {
      const { clip, trackIndex } = clipAtPos;
      viewActions.selectClip(clip.id);

      // Check for resize handle
      const handle = getResizeHandle(clip, trackIndex, x, y);
      if (handle) {
        isResizing = true;
        resizeHandle = handle;
        draggedClip = clip;
        draggedTrackIndex = trackIndex;
        dragStartX = x;
        dragStartTime =
          handle === "left" ? clip.startTime : clip.startTime + clip.duration;
        originalClipDuration = clip.duration; // Store for proportional scaling
        originalClipStartTime = clip.startTime;

        // Store original keyframe positions
        originalKeyframes = [];
        for (const curve of clip.automation) {
          for (const kf of curve.keyframes) {
            originalKeyframes.push({
              curve: curve.parameterName,
              time: kf.time,
              value: kf.value,
            });
          }
        }
      } else {
        isDragging = true;
        draggedClip = clip;
        draggedTrackIndex = trackIndex;
        dragStartX = x;
        dragStartTime = clip.startTime;
      }
    } else {
      viewActions.selectClip(null);
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track Alt key state
    altKeyPressed = e.altKey;

    // Handle scrubbing
    if (isScrubbing) {
      const scrubTime = Math.max(0, xToTime(x));
      playbackActions.seek(scrubTime);
      render();
      return;
    }

    // Handle keyframe dragging
    if (isDraggingKeyframe && selectedKeyframe) {
      const deltaX = x - dragStartX;
      const deltaTime = deltaX / $timelineView.pixelsPerSecond;
      const newTime = snapTime(Math.max(0, dragStartTime + deltaTime));

      // Find the clip
      let clip: Clip | null = null;
      for (const track of $timeline.tracks) {
        const foundClip = track.clips.find(
          (c) => c.id === selectedKeyframe.clipId
        );
        if (foundClip) {
          clip = foundClip;
          break;
        }
      }

      if (!clip) return;

      // Constrain to clip bounds
      const constrainedTime = Math.max(
        clip.startTime,
        Math.min(clip.startTime + clip.duration, newTime)
      );

      // If time changed, update the keyframe
      if (constrainedTime !== selectedKeyframe.time) {
        const keyframes =
          clip.parameters[selectedKeyframe.paramName]?.keyframes;
        if (keyframes) {
          const keyframe = keyframes.find(
            (kf) => kf.time === selectedKeyframe.time
          );
          if (keyframe) {
            // Remove old keyframe and add at new time
            timelineActions.removeKeyframe(
              clip.id,
              selectedKeyframe.paramName,
              selectedKeyframe.time
            );
            timelineActions.addKeyframe(
              clip.id,
              selectedKeyframe.paramName,
              constrainedTime,
              keyframe.value
            );
            // Update selected keyframe reference in store
            viewActions.selectKeyframe(
              clip.id,
              selectedKeyframe.paramName,
              constrainedTime
            );
            dragStartTime = constrainedTime;
          }
        }
      }
      render();
      return;
    }

    // Update hovered clip
    hoveredClip = getClipAtPosition(x, y);

    // Update cursor (add indicator for proportional mode)
    if (y < RULER_HEIGHT) {
      canvas.style.cursor = "pointer";
    } else if (isResizing && e.altKey) {
      canvas.style.cursor = "col-resize"; // Different cursor for proportional mode
    } else if (hoveredClip) {
      const handle = getResizeHandle(
        hoveredClip.clip,
        hoveredClip.trackIndex,
        x,
        y
      );
      canvas.style.cursor = handle ? "ew-resize" : "move";
    } else {
      canvas.style.cursor = "default";
    }

    // Handle dragging
    if (isDragging && draggedClip) {
      const deltaX = x - dragStartX;
      const deltaTime = deltaX / $timelineView.pixelsPerSecond;
      const newTime = snapTime(Math.max(0, dragStartTime + deltaTime));
      timelineActions.updateClipTime(draggedClip.id, newTime);
    }

    // Handle resizing
    if (isResizing && draggedClip && resizeHandle) {
      const currentTime = xToTime(x);
      const snappedTime = snapTime(currentTime);

      if (resizeHandle === "left") {
        // Calculate relative to ORIGINAL state
        const originalEnd = originalClipStartTime + originalClipDuration;
        const maxStart = originalEnd - 0.1;
        let newStart = Math.min(snappedTime, maxStart);

        // Check if Alt/Option key is held for proportional mode
        const proportionalMode = e.altKey;

        if (!proportionalMode) {
          // Absolute mode: constrain to keyframe bounds based on ORIGINAL positions
          if (originalKeyframes.length > 0) {
            // Find earliest keyframe in original positions
            const earliestOriginalKfTime = Math.min(
              ...originalKeyframes.map((kf) => kf.time)
            );
            const earliestKeyframeAbsoluteTime =
              originalClipStartTime + earliestOriginalKfTime;
            newStart = Math.max(newStart, earliestKeyframeAbsoluteTime);
          }
        }

        const newDuration = originalEnd - newStart;
        const timeDelta = newStart - originalClipStartTime;

        // Update keyframes based on mode
        if (originalKeyframes.length > 0) {
          const updates: Array<{
            curve: string;
            oldTime: number;
            newTime: number;
            value: number;
          }> = [];

          // Calculate new positions from ORIGINAL keyframes
          for (const originalKf of originalKeyframes) {
            let newTime: number;

            if (proportionalMode) {
              // Proportional mode: maintain relative position within clip
              // e.g., keyframe at 50% of original clip should be at 50% of new clip
              const relativePosition = originalKf.time / originalClipDuration;
              newTime = relativePosition * newDuration;
            } else {
              // Absolute mode: maintain absolute timeline position
              // originalAbsoluteTime = originalClipStartTime + originalKf.time
              // newRelativeTime = originalAbsoluteTime - newStart
              const absoluteTime = originalClipStartTime + originalKf.time;
              newTime = absoluteTime - newStart;
            }

            updates.push({
              curve: originalKf.curve,
              oldTime: originalKf.time,
              newTime: newTime,
              value: originalKf.value,
            });
          }

          // Clear all existing keyframes and replace with calculated ones
          // Group updates by curve
          const updatesByCurve = new Map<
            string,
            Array<{ time: number; value: number }>
          >();
          for (const update of updates) {
            if (!updatesByCurve.has(update.curve)) {
              updatesByCurve.set(update.curve, []);
            }
            updatesByCurve.get(update.curve)!.push({
              time: update.newTime,
              value: update.value,
            });
          }

          // Clear and rebuild each curve
          for (const [curveName, keyframes] of updatesByCurve) {
            timelineActions.clearKeyframes(draggedClip.id, curveName);
            for (const kf of keyframes) {
              timelineActions.addKeyframe(
                draggedClip.id,
                curveName,
                kf.time,
                kf.value
              );
            }
          }
        }

        timelineActions.updateClipTime(draggedClip.id, newStart);
        timelineActions.updateClipDuration(draggedClip.id, newDuration);
      } else {
        // Right resize - calculate relative to ORIGINAL state
        const minEnd = originalClipStartTime + 0.1;
        let newEnd = Math.max(snappedTime, minEnd);

        // Check if Alt/Option key is held for proportional mode
        const proportionalMode = e.altKey;

        if (!proportionalMode) {
          // Absolute mode: constrain to keyframe bounds based on ORIGINAL positions
          if (originalKeyframes.length > 0) {
            // Find latest keyframe in original positions
            const latestOriginalKfTime = Math.max(
              ...originalKeyframes.map((kf) => kf.time)
            );
            const latestKeyframeAbsoluteTime =
              originalClipStartTime + latestOriginalKfTime;
            newEnd = Math.max(newEnd, latestKeyframeAbsoluteTime);
          }
        }

        const newDuration = newEnd - originalClipStartTime;

        // Update keyframes in proportional mode only
        if (proportionalMode && originalKeyframes.length > 0) {
          const scale = newDuration / originalClipDuration;
          const updates: Array<{
            curve: string;
            oldTime: number;
            newTime: number;
            value: number;
          }> = [];

          // Proportional mode: scale all keyframes
          for (const originalKf of originalKeyframes) {
            updates.push({
              curve: originalKf.curve,
              oldTime: originalKf.time,
              newTime: originalKf.time * scale,
              value: originalKf.value,
            });
          }

          // Clear all existing keyframes and replace with calculated ones
          const updatesByCurve = new Map<
            string,
            Array<{ time: number; value: number }>
          >();
          for (const update of updates) {
            if (!updatesByCurve.has(update.curve)) {
              updatesByCurve.set(update.curve, []);
            }
            updatesByCurve.get(update.curve)!.push({
              time: update.newTime,
              value: update.value,
            });
          }

          // Clear and rebuild each curve
          for (const [curveName, keyframes] of updatesByCurve) {
            timelineActions.clearKeyframes(draggedClip.id, curveName);
            for (const kf of keyframes) {
              timelineActions.addKeyframe(
                draggedClip.id,
                curveName,
                kf.time,
                kf.value
              );
            }
          }
        }

        // Ensure clip stays at original start position (right resize shouldn't move clip)
        if (draggedClip.startTime !== originalClipStartTime) {
          timelineActions.updateClipTime(draggedClip.id, originalClipStartTime);
        }
        timelineActions.updateClipDuration(draggedClip.id, newDuration);
      }
    }

    render();
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
    isScrubbing = false;
    isDraggingKeyframe = false;
    resizeHandle = null;
    draggedClip = null;
    draggedTrackIndex = -1;
    originalKeyframes = []; // Clear stored keyframes
    render();
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(
        10,
        Math.min(200, $timelineView.pixelsPerSecond * zoomFactor)
      );
      viewActions.setZoom(newZoom);
    } else {
      // Scroll
      const scrollAmount = e.deltaY;
      viewActions.setScroll($timelineView.scrollX + scrollAmount);
    }

    render();
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }

    // Track which track we're hovering over
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const trackIndex = yToTrackIndex(y);

    if (trackIndex >= 0 && trackIndex < $timeline.tracks.length) {
      isDraggingOver = true;
      dropTargetTrack = trackIndex;
      render();
    } else {
      isDraggingOver = false;
      dropTargetTrack = -1;
    }
  }

  function handleDragLeave() {
    isDraggingOver = false;
    dropTargetTrack = -1;
    render();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();

    if (!e.dataTransfer) return;

    try {
      // Try to get data from different formats
      let dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) {
        dataStr = e.dataTransfer.getData("text/plain");
      }

      if (!dataStr) {
        console.log("No data found in drop event");
        return;
      }

      const data = JSON.parse(dataStr);
      console.log("Drop data:", data);

      if (data.type === "shader" && data.shaderId) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Determine drop time and track
        const dropTime = snapTime(Math.max(0, xToTime(x)));
        const trackIndex = yToTrackIndex(y);

        console.log(`Dropping shader at track ${trackIndex}, time ${dropTime}`);

        // Add clip to the appropriate track
        if (trackIndex >= 0 && trackIndex < $timeline.tracks.length) {
          const trackId = $timeline.tracks[trackIndex].id;
          timelineActions.addClip(trackId, data.shaderId, dropTime, 5.0);
          isDraggingOver = false;
          dropTargetTrack = -1;
          render();
        } else {
          console.log(`Invalid track index: ${trackIndex}`);
        }
      }
    } catch (error) {
      console.error("Failed to handle drop:", error);
    }

    isDraggingOver = false;
    dropTargetTrack = -1;
  }

  onMount(() => {
    ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Initial render
    render();

    // Subscribe to store changes
    const unsubscribers = [
      timeline.subscribe(() => render()),
      timelineView.subscribe(() => render()),
      playback.subscribe(() => render()),
    ];

    return () => {
      unsubscribers.forEach((u) => u());
    };
  });
</script>

<div class="timeline-container">
  <canvas
    class="timeline"
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:wheel={handleWheel}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    {width}
    {height}
  ></canvas>
</div>

<style>
  .timeline-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #1a1a1a;
    position: relative;
  }

  canvas {
    display: block;
    cursor: default;
  }
</style>
