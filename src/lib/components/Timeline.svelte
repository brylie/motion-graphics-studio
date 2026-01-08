<script lang="ts">
  import { onMount } from "svelte";
  import {
    timeline,
    timelineView,
    timelineActions,
    viewActions,
  } from "$lib/stores/timeline";
  import { playback, playbackActions } from "$lib/stores/playback";
  import { dragDropStore } from "$lib/stores/dragDrop";
  import TimelineRuler from "./TimelineRuler.svelte";
  import TimelineTrack from "./TimelineTrack.svelte";
  import type { Clip } from "$lib/timeline/types";

  let timelineContainer: HTMLDivElement;
  let isResizing = false;
  let resizeHandle: "left" | "right" | null = null;
  let dragStartX = 0;
  let dragStartTime = 0;
  let draggedClipId: string | null = null;
  let originalClipDuration = 0;
  let originalClipStartTime = 0;
  let originalKeyframes: Array<{ curve: string; time: number; value: number }> =
    [];
  let altKeyPressed = false;
  let timelineContentArea: HTMLDivElement;
  let tracksContainer: HTMLDivElement;

  $: totalWidth = $timeline.duration * $timelineView.pixelsPerSecond;
  $: playheadPosition = $playback.currentTime * $timelineView.pixelsPerSecond;

  function snapTime(time: number, gridSize: number = 0.1): number {
    return Math.round(time / gridSize) * gridSize;
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Cancel drag operation on ESC key
    if (e.key === "Escape" && $dragDropStore.isDragging) {
      dragDropStore.endDrag();
    }
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(
        10,
        Math.min(200, $timelineView.pixelsPerSecond * zoomFactor)
      );
      viewActions.setZoom(newZoom);
    }
    // Otherwise allow native scroll
  }

  function handleClipSelect(e: CustomEvent<{ clipId: string }>) {
    viewActions.selectClip(e.detail.clipId);
  }

  function handleClipResizeStart(
    e: CustomEvent<{ clipId: string; handle: "left" | "right"; startX: number }>
  ) {
    isResizing = true;
    resizeHandle = e.detail.handle;
    draggedClipId = e.detail.clipId;
    dragStartX = e.detail.startX;

    // Find clip and store original state
    for (const track of $timeline.tracks) {
      const clip = track.clips.find((c) => c.id === e.detail.clipId);
      if (clip) {
        originalClipStartTime = clip.startTime;
        originalClipDuration = clip.duration;
        dragStartTime =
          e.detail.handle === "left"
            ? clip.startTime
            : clip.startTime + clip.duration;

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
        break;
      }
    }

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }

  function handleWindowMouseMove(e: MouseEvent) {
    altKeyPressed = e.altKey;

    if (isResizing && draggedClipId && resizeHandle) {
      if (!timelineContentArea) return;
      const rect = timelineContentArea.getBoundingClientRect();
      const scrollLeft = timelineContainer?.scrollLeft || 0;
      const relativeX = e.clientX - rect.left + scrollLeft;
      const currentTime = relativeX / $timelineView.pixelsPerSecond;
      const snappedTime = snapTime(currentTime);

      const clip = findClip(draggedClipId);
      if (!clip) return;

      const proportionalMode = e.altKey;

      if (resizeHandle === "left") {
        const originalEnd = originalClipStartTime + originalClipDuration;
        const maxStart = originalEnd - 0.1;
        let newStart = Math.min(snappedTime, maxStart);

        if (!proportionalMode && originalKeyframes.length > 0) {
          const earliestOriginalKfTime = Math.min(
            ...originalKeyframes.map((kf) => kf.time)
          );
          const earliestKeyframeAbsoluteTime =
            originalClipStartTime + earliestOriginalKfTime;
          if (newStart > originalClipStartTime) {
            newStart = Math.min(newStart, earliestKeyframeAbsoluteTime);
          }
        }

        const newDuration = originalEnd - newStart;
        updateKeyframesForResize(
          clip,
          newStart,
          newDuration,
          proportionalMode,
          "left"
        );
        timelineActions.updateClipTime(draggedClipId, newStart);
        timelineActions.updateClipDuration(draggedClipId, newDuration);
      } else {
        const minEnd = originalClipStartTime + 0.1;
        let newEnd = Math.max(snappedTime, minEnd);

        if (!proportionalMode && originalKeyframes.length > 0) {
          const latestOriginalKfTime = Math.max(
            ...originalKeyframes.map((kf) => kf.time)
          );
          const latestKeyframeAbsoluteTime =
            originalClipStartTime + latestOriginalKfTime;
          newEnd = Math.max(newEnd, latestKeyframeAbsoluteTime);
        }

        const newDuration = newEnd - originalClipStartTime;
        updateKeyframesForResize(
          clip,
          originalClipStartTime,
          newDuration,
          proportionalMode,
          "right"
        );
        timelineActions.updateClipDuration(draggedClipId, newDuration);
      }
    }
  }

  function handleWindowMouseUp() {
    isResizing = false;
    resizeHandle = null;
    draggedClipId = null;
    originalKeyframes = [];
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
  }

  function findClip(clipId: string): Clip | null {
    for (const track of $timeline.tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }

  function updateKeyframesForResize(
    clip: Clip,
    newStart: number,
    newDuration: number,
    proportionalMode: boolean,
    handle: "left" | "right"
  ) {
    if (originalKeyframes.length === 0) return;

    const updates: Map<
      string,
      Array<{ time: number; value: number }>
    > = new Map();

    for (const originalKf of originalKeyframes) {
      let newTime: number;

      if (proportionalMode) {
        const relativePosition = originalKf.time / originalClipDuration;
        newTime = relativePosition * newDuration;
      } else {
        if (handle === "left") {
          const absoluteTime = originalClipStartTime + originalKf.time;
          newTime = absoluteTime - newStart;
        } else {
          newTime = originalKf.time;
        }
      }

      if (!updates.has(originalKf.curve)) {
        updates.set(originalKf.curve, []);
      }
      updates
        .get(originalKf.curve)!
        .push({ time: newTime, value: originalKf.value });
    }

    for (const [curveName, keyframes] of updates) {
      timelineActions.clearKeyframes(clip.id, curveName);
      for (const kf of keyframes) {
        timelineActions.addKeyframe(clip.id, curveName, kf.time, kf.value);
      }
    }
  }

  function handleKeyframeSelect(
    e: CustomEvent<{ clipId: string; paramName: string; time: number }>
  ) {
    const { clipId, paramName, time } = e.detail;
    if (time === -1) {
      viewActions.selectKeyframe(null, null, null);
    } else {
      viewActions.selectKeyframe(clipId, paramName, time);
      viewActions.selectClip(clipId);
    }
  }

  function handleKeyframeMove(
    e: CustomEvent<{
      clipId: string;
      paramName: string;
      oldTime: number;
      newTime: number;
      newValue: number;
    }>
  ) {
    const { clipId, paramName, oldTime, newTime, newValue } = e.detail;
    timelineActions.removeKeyframe(clipId, paramName, oldTime);
    timelineActions.addKeyframe(clipId, paramName, newTime, newValue);
    viewActions.selectKeyframe(clipId, paramName, newTime);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      // Check if it's a clip being dragged
      const types = Array.from(e.dataTransfer.types);
      if (types.includes("application/json")) {
        e.dataTransfer.dropEffect = "move";
      } else {
        e.dataTransfer.dropEffect = "copy";
      }
    }

    // Update preview position
    const trackId = getTrackAtPosition(e.clientY);
    if (trackId && tracksContainer) {
      const rect = tracksContainer.getBoundingClientRect();
      const scrollLeft = timelineContainer?.scrollLeft || 0;
      // Calculate relative to tracks container, accounting for the 80px label column
      const relativeX = e.clientX - rect.left + scrollLeft - 80;
      const dropTime = snapTime(
        Math.max(0, relativeX / $timelineView.pixelsPerSecond)
      );
      dragDropStore.updatePreview(trackId, dropTime, true);
    }
  }

  function handleDragLeave(e: DragEvent) {
    // Only hide preview if we're leaving the timeline container
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      dragDropStore.updatePreview(null, 0, false);
    }
  }

  function getTrackAtPosition(y: number): string | null {
    // Find which track element the mouse is over
    const trackElements = timelineContainer.querySelectorAll(".timeline-track");
    for (const trackEl of trackElements) {
      const rect = trackEl.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        return trackEl.getAttribute("data-track-id");
      }
    }
    return null;
  }

  function handleDrop(e: DragEvent) {
    console.log("[Timeline] Drop event received", e);
    e.preventDefault();

    if (!e.dataTransfer) {
      console.warn("[Timeline] No dataTransfer in drop event");
      return;
    }

    try {
      let dataStr = e.dataTransfer.getData("application/json");
      console.log("[Timeline] getData('application/json'):", dataStr);

      if (!dataStr) {
        dataStr = e.dataTransfer.getData("text/plain");
        console.log("[Timeline] getData('text/plain'):", dataStr);
      }

      if (!dataStr) {
        console.warn("[Timeline] No drag data found in dataTransfer");
        console.log("[Timeline] Available types:", e.dataTransfer.types);
        return;
      }

      const data = JSON.parse(dataStr);
      console.log(
        "[Timeline] Drop data:",
        data,
        "clientY:",
        e.clientY,
        "target:",
        e.target
      );

      if (data.type === "shader" && data.shaderId) {
        // Detect which track the drop occurred on
        // Try to find track from the actual drop target first
        let trackId: string | null = null;
        let targetElement = e.target as HTMLElement;

        // Traverse up to find the track element
        while (targetElement && !trackId) {
          if (
            targetElement.hasAttribute &&
            targetElement.hasAttribute("data-track-id")
          ) {
            trackId = targetElement.getAttribute("data-track-id");
            break;
          }
          if (targetElement.closest) {
            const trackEl = targetElement.closest("[data-track-id]");
            if (trackEl) {
              trackId = trackEl.getAttribute("data-track-id");
              break;
            }
          }
          targetElement = targetElement.parentElement as HTMLElement;
        }

        // Fallback to position-based detection
        if (!trackId) {
          trackId = getTrackAtPosition(e.clientY);
        }

        console.log("Detected track ID:", trackId);

        if (!trackId) {
          console.warn("No track found at drop position");
          return;
        }

        if (!tracksContainer) return;
        const rect = tracksContainer.getBoundingClientRect();
        const scrollLeft = timelineContainer?.scrollLeft || 0;
        const relativeX = e.clientX - rect.left + scrollLeft - 80;
        const dropTime = snapTime(
          Math.max(0, relativeX / $timelineView.pixelsPerSecond)
        );

        timelineActions.addClip(trackId, data.shaderId, dropTime, 5.0);
      } else if (data.type === "clip" && data.clipId) {
        // Moving an existing clip to a different track
        const targetTrackId = getTrackAtPosition(e.clientY);

        if (!targetTrackId) {
          console.warn("No track found at drop position");
          return;
        }

        // Find the source clip
        let sourceClip = null;
        let sourceTrackId = null;
        for (const track of $timeline.tracks) {
          const clip = track.clips.find((c) => c.id === data.clipId);
          if (clip) {
            sourceClip = clip;
            sourceTrackId = track.id;
            break;
          }
        }

        if (!sourceClip || !sourceTrackId) {
          console.warn("Source clip not found");
          return;
        }

        if (!tracksContainer) return;
        const rect = tracksContainer.getBoundingClientRect();
        const scrollLeft = timelineContainer?.scrollLeft || 0;
        const relativeX = e.clientX - rect.left + scrollLeft - 80;
        const dropTime = snapTime(
          Math.max(0, relativeX / $timelineView.pixelsPerSecond)
        );

        // If dropping on a different track, move the clip
        if (targetTrackId !== sourceTrackId) {
          // Remove from source track and add to target track
          timelineActions.removeClip(data.clipId);
          timelineActions.addClip(
            targetTrackId,
            sourceClip.shaderId,
            dropTime,
            sourceClip.duration,
            sourceClip.parameters,
            sourceClip.automation
          );
        } else {
          // Same track, just update position
          timelineActions.updateClipTime(data.clipId, dropTime);
        }
      }
    } catch (error) {
      console.error("Failed to handle drop:", error);
    } finally {
      // Always clear the drag state when drop completes
      dragDropStore.endDrag();
    }
  }

  onMount(() => {
    // Timeline is now ready
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="timeline-container"
  bind:this={timelineContainer}
  on:wheel={handleWheel}
  on:keydown={handleKeyDown}
  role="application"
  aria-label="Timeline"
  tabindex="0"
>
  <div class="timeline-grid">
    <!-- Mode indicator -->
    {#if isResizing && altKeyPressed}
      <div class="mode-indicator proportional">PROPORTIONAL MODE (Alt)</div>
    {:else if isResizing}
      <div class="mode-indicator absolute">ABSOLUTE MODE</div>
    {/if}

    <TimelineRuler
      duration={$timeline.duration}
      pixelsPerSecond={$timelineView.pixelsPerSecond}
    />

    <!-- Tracks -->
    <div
      class="tracks-container"
      bind:this={tracksContainer}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
    >
      {#each $timeline.tracks as track (track.id)}
        <TimelineTrack
          {track}
          pixelsPerSecond={$timelineView.pixelsPerSecond}
          selectedClipId={$timelineView.selectedClipId}
          selectedKeyframe={$timelineView.selectedKeyframe}
          on:clipselect={handleClipSelect}
          on:clipresizestart={handleClipResizeStart}
          on:keyframeselect={handleKeyframeSelect}
          on:keyframemove={handleKeyframeMove}
        />
      {/each}
    </div>

    <!-- Timeline content area overlay (for playhead visual only) -->
    <div class="timeline-content-overlay" bind:this={timelineContentArea}>
      <!-- Playhead -->
      <div
        class="playhead"
        style="left: {playheadPosition}px;"
        aria-label="Current time: {$playback.currentTime.toFixed(2)}s"
      ></div>
    </div>
  </div>
</div>

<style>
  .timeline-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    background: #111827;
    position: relative;
    cursor: default;
  }

  .timeline-grid {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    position: relative;
  }

  .tracks-container {
    position: relative;
    flex: 1;
    min-height: 100px;
  }

  .timeline-content-overlay {
    position: absolute;
    top: 30px;
    left: 80px;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 50;
  }

  .timeline-content-overlay > * {
    pointer-events: auto;
  }

  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ef4444;
    pointer-events: none;
    z-index: 101;
  }

  .playhead::before {
    content: "";
    position: absolute;
    top: 0;
    left: -6px;
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 10px solid #ef4444;
  }

  .mode-indicator {
    position: fixed;
    top: 10px;
    right: 20px;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    font-family: monospace;
    color: white;
    z-index: 1000;
    pointer-events: none;
  }

  .mode-indicator.proportional {
    background: rgba(251, 146, 60, 0.95);
  }

  .mode-indicator.absolute {
    background: rgba(59, 130, 246, 0.95);
  }
</style>
