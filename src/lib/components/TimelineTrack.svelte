<script lang="ts">
  import type { Track, Clip } from "$lib/timeline/types";
  import TimelineClip from "./TimelineClip.svelte";
  import AutomationLane from "./AutomationLane.svelte";
  import { timelineActions } from "$lib/stores/timeline";
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
    clipdragstart: { clipId: string; startX: number };
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

  const TRACK_HEIGHT = 60;
  const AUTOMATION_LANE_HEIGHT = 40;

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
    const result = Array.from(params);
    console.log(
      `Track ${track.id} automation params:`,
      result,
      "clips:",
      track.clips.length
    );
    return result;
  })();

  // Calculate automation lane count for this track
  $: automationCount = allAutomationParams.length;

  $: trackHeight = TRACK_HEIGHT + automationCount * AUTOMATION_LANE_HEIGHT;

  $: console.log(
    `Track ${track.id} height:`,
    trackHeight,
    "automationCount:",
    automationCount
  );

  function handleToggleMute() {
    timelineActions.toggleMute(track.id);
  }

  function handleToggleSolo() {
    timelineActions.toggleSolo(track.id);
  }

  function handleClipSelect(e: CustomEvent<{ clipId: string }>) {
    dispatch("clipselect", e.detail);
  }

  function handleClipDragStart(
    e: CustomEvent<{ clipId: string; startX: number }>
  ) {
    dispatch("clipdragstart", e.detail);
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
</script>

<div
  class="timeline-track"
  style="min-height: {trackHeight}px;"
  data-track-id={track.id}
>
  <div class="track-header">
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

  <div class="track-content">
    <div class="clips-container" style="height: {TRACK_HEIGHT}px;">
      {#each track.clips as clip (clip.id)}
        <TimelineClip
          {clip}
          {pixelsPerSecond}
          isSelected={selectedClipId === clip.id}
          on:select={handleClipSelect}
          on:dragstart={handleClipDragStart}
          on:resizestart={handleClipResizeStart}
        />
      {/each}
    </div>

    <!-- Automation lanes -->
    {#if automationCount > 0}
      <div class="automation-lanes">
        <!-- Group all automation curves by parameter name across all clips -->
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
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #374151;
    background: #111827;
  }

  .track-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #1f2937;
    border-bottom: 1px solid #374151;
    min-height: 36px;
  }

  .track-name {
    font-size: 14px;
    font-weight: 500;
    color: #f3f4f6;
  }

  .track-controls {
    display: flex;
    gap: 4px;
  }

  .control-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #4b5563;
    background: #374151;
    color: #9ca3af;
    border-radius: 3px;
    font-size: 11px;
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
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
  }

  .clips-container {
    position: relative;
    width: 100%;
  }

  .automation-lanes {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
    background: rgba(255, 0, 0, 0.1); /* Debug background */
  }

  .automation-lane-row {
    position: relative;
    width: 100%;
    pointer-events: none;
    background: rgba(0, 255, 0, 0.1); /* Debug background */
  }

  .automation-lane-wrapper {
    position: absolute;
    top: 0;
    pointer-events: auto;
    height: 100%;
    background: rgba(0, 0, 255, 0.1); /* Debug background */
  }
</style>
