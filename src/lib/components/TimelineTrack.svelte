<script lang="ts">
  import type { Track, Clip } from "$lib/timeline/types";
  import TimelineClip from "./TimelineClip.svelte";
  import AutomationLane from "./AutomationLane.svelte";
  import { timelineActions } from "$lib/stores/timeline";
  import { dragDropStore } from "$lib/stores/dragDrop";
  import { createEventDispatcher } from "svelte";

  export let track: Track;
  export let pixelsPerSecond: number;
  export let selectedClipId: string | null;
  export let selectedKeyframe: {
    clipId: string;
    paramName: string;
    time: number;
  } | null;

  const dispatch = createEventDispatcher<{
    clipselect: { clipId: string };
    clipresizestart: {
      clipId: string;
      handle: "left" | "right";
      startX: number;
    };
    keyframeselect: { clipId: string; paramName: string; time: number };
    keyframemove: {
      clipId: string;
      paramName: string;
      oldTime: number;
      newTime: number;
      newValue: number;
    };
  }>();

  const TRACK_HEIGHT = 28;
  const AUTOMATION_LANE_HEIGHT = 50;

  // Get all unique automation parameter names across all clips - make it reactive
  $: allAutomationParams = (() => {
    const params = new Set<string>();
    for (const clip of track.clips) {
      for (const curve of clip.automation) {
        if (curve.keyframes.length > 0) {
          params.add(curve.parameterName);
        }
      }
    }
    return Array.from(params);
  })();

  // Calculate automation lane count for this track
  $: automationCount = allAutomationParams.length;

  $: trackHeight = TRACK_HEIGHT + automationCount * AUTOMATION_LANE_HEIGHT;

  function handleToggleMute() {
    timelineActions.toggleMute(track.id);
  }

  function handleToggleSolo() {
    timelineActions.toggleSolo(track.id);
  }

  function handleClipSelect(e: CustomEvent<{ clipId: string }>) {
    dispatch("clipselect", e.detail);
  }

  function handleClipResizeStart(
    e: CustomEvent<{ clipId: string; handle: "left" | "right"; startX: number }>
  ) {
    dispatch("clipresizestart", e.detail);
  }

  function handleKeyframeSelect(
    clipId: string,
    paramName: string,
    time: number
  ) {
    if (time === -1) {
      dispatch("keyframeselect", { clipId: "", paramName: "", time: -1 });
    } else {
      dispatch("keyframeselect", { clipId, paramName, time });
    }
  }

  function handleKeyframeMove(
    clipId: string,
    paramName: string,
    detail: { oldTime: number; newTime: number; newValue: number }
  ) {
    dispatch("keyframemove", { clipId, paramName, ...detail });
  }

  let isDragOver = false;

  // Clear drag-over state when drag operation ends
  $: if (!$dragDropStore.isDragging) {
    isDragOver = false;
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    // Only mark as not drag-over if we're leaving the track element itself
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      isDragOver = false;
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
    isDragOver = true;
  }

  function handleDragEnd() {
    // Clean up drag-over state when drag ends
    isDragOver = false;
  }
</script>

<div
  class="timeline-track"
  class:drag-over={isDragOver}
  style="min-height: {trackHeight}px;"
  data-track-id={track.id}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:dragend={handleDragEnd}
  role="region"
  aria-label="Track {track.name}"
>
  <!-- Track label column -->
  <div class="track-label">
    <div class="track-name">{track.name}</div>
    <div class="track-controls">
      <button
        class="control-btn"
        class:active={track.muted}
        on:click={handleToggleMute}
        aria-label={track.muted ? "Unmute track" : "Mute track"}
        title={track.muted ? "Unmute" : "Mute"}
      >
        M
      </button>
      <button
        class="control-btn"
        class:active={track.solo}
        on:click={handleToggleSolo}
        aria-label={track.solo ? "Unsolo track" : "Solo track"}
        title={track.solo ? "Unsolo" : "Solo"}
      >
        S
      </button>
    </div>
  </div>

  <!-- Timeline content area -->
  <div class="track-content">
    <!-- Clips -->
    <div class="clips-container" style="height: {TRACK_HEIGHT}px;">
      {#each track.clips as clip (clip.id)}
        <TimelineClip
          {clip}
          {pixelsPerSecond}
          isSelected={selectedClipId === clip.id}
          on:select={handleClipSelect}
          on:resizestart={handleClipResizeStart}
        />
      {/each}
    </div>

    <!-- Automation lanes -->
    {#if automationCount > 0}
      <div class="automation-lanes">
        {#each allAutomationParams as paramName}
          <div
            class="automation-lane-row"
            style="height: {AUTOMATION_LANE_HEIGHT}px;"
          >
            {#each track.clips as clip (clip.id)}
              {@const curve = clip.automation.find(
                (c) => c.parameterName === paramName
              )}
              {#if curve && curve.keyframes.length > 0}
                <div
                  class="automation-lane-wrapper"
                  style="left: {clip.startTime *
                    pixelsPerSecond}px; width: {clip.duration *
                    pixelsPerSecond}px;"
                >
                  <AutomationLane
                    parameterName={curve.parameterName}
                    keyframes={curve.keyframes}
                    clipDuration={clip.duration}
                    {pixelsPerSecond}
                    laneHeight={AUTOMATION_LANE_HEIGHT}
                    selectedKeyframeTime={selectedKeyframe?.clipId ===
                      clip.id &&
                    selectedKeyframe?.paramName === curve.parameterName
                      ? selectedKeyframe.time
                      : null}
                    onkeyframeselect={(detail) =>
                      handleKeyframeSelect(
                        clip.id,
                        curve.parameterName,
                        detail.time
                      )}
                    onkeyframemove={(detail) =>
                      handleKeyframeMove(clip.id, curve.parameterName, detail)}
                  />
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .timeline-track {
    display: grid;
    grid-template-columns: 80px 1fr;
    border-bottom: 1px solid #374151;
    background: #111827;
    position: relative;
    transition: background-color 0.15s ease;
  }

  .timeline-track.drag-over {
    background: #1f2937;
  }

  .track-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 8px;
    background: #1f2937;
    border-right: 1px solid #374151;
    z-index: 10;
    position: sticky;
    left: 0;
  }

  .track-name {
    font-size: 11px;
    font-weight: 600;
    color: #f3f4f6;
    line-height: 1.2;
  }

  .track-controls {
    display: flex;
    gap: 2px;
  }

  .control-btn {
    width: 20px;
    height: 20px;
    border: 1px solid #4b5563;
    background: #374151;
    color: #9ca3af;
    border-radius: 2px;
    font-size: 9px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .control-btn:hover {
    background: #4b5563;
    color: #f3f4f6;
  }

  .control-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #2563eb;
  }

  .track-content {
    position: relative;
    min-height: 100%;
    overflow: hidden;
  }

  .clips-container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    width: 100%;
  }

  .automation-lanes {
    position: absolute;
    left: 0;
    right: 0;
    top: 36px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .automation-lane-row {
    position: relative;
    width: 100%;
    pointer-events: none;
  }

  .automation-lane-wrapper {
    position: absolute !important;
    top: 0;
    pointer-events: auto;
    height: 100%;
  }
</style>
