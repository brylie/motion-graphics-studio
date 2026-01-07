<script lang="ts">
  import AutomationLane from "./AutomationLane.svelte";
  import type { Keyframe } from "$lib/timeline/types";

  export let parameterCount: number = 2;
  export let readonly: boolean = false;

  let lanes: Array<{
    name: string;
    keyframes: Keyframe[];
    selectedTime: number | null;
  }> = [];

  $: {
    lanes = Array.from({ length: parameterCount }, (_, i) => ({
      name: `param${i + 1}`,
      keyframes: [
        { time: 2 + i, value: 0.3 },
        { time: 5 + i, value: 0.7 },
        { time: 8 + i, value: 0.4 },
      ],
      selectedTime: null,
    }));
  }

  function handleKeyframeSelect(laneIndex: number, event: CustomEvent) {
    if (event.detail.time === -1) {
      lanes[laneIndex].selectedTime = null;
    } else {
      lanes[laneIndex].selectedTime = event.detail.time;
    }
    // Deselect other lanes
    lanes.forEach((lane, i) => {
      if (i !== laneIndex) {
        lane.selectedTime = null;
      }
    });
    lanes = lanes; // Trigger reactivity
  }

  function handleKeyframeMove(laneIndex: number, event: CustomEvent) {
    const { oldTime, newTime, newValue } = event.detail;
    const lane = lanes[laneIndex];

    // Remove old keyframe
    lane.keyframes = lane.keyframes.filter(
      (kf) => Math.abs(kf.time - oldTime) >= 0.01
    );

    // Add new keyframe
    lane.keyframes.push({ time: newTime, value: newValue });
    lane.keyframes.sort((a, b) => a.time - b.time);

    // Update selection
    lane.selectedTime = newTime;

    lanes = lanes; // Trigger reactivity
  }
</script>

<div class="story-container">
  <h3>Automation Lanes Demo</h3>
  <p>
    Each lane handles its own coordinate space independently. Try dragging
    keyframes in different lanes.
  </p>

  <div class="lanes">
    {#each lanes as lane, i}
      <div class="lane-wrapper">
        <AutomationLane
          parameterName={lane.name}
          keyframes={lane.keyframes}
          clipDuration={10}
          clipStartTime={0}
          pixelsPerSecond={50}
          laneHeight={40}
          keyframeSize={8}
          selectedKeyframeTime={lane.selectedTime}
          {readonly}
          on:keyframeSelect={(e) => handleKeyframeSelect(i, e)}
          on:keyframeMove={(e) => handleKeyframeMove(i, e)}
        />
      </div>
    {/each}
  </div>

  <div class="info">
    <h4>Current State:</h4>
    {#each lanes as lane, i}
      <div class="lane-info">
        <strong>{lane.name}:</strong>
        {#if lane.selectedTime !== null}
          <span class="selected"
            >Selected keyframe at time {lane.selectedTime.toFixed(1)}s</span
          >
        {:else}
          <span>No selection</span>
        {/if}
        <div class="keyframe-list">
          {#each lane.keyframes as kf}
            <span class="keyframe-chip">
              t={kf.time.toFixed(1)}s, v={kf.value.toFixed(2)}
            </span>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if readonly}
    <p class="readonly-notice">
      <strong>Read-only mode:</strong> Interaction is disabled
    </p>
  {/if}
</div>

<style>
  .story-container {
    padding: 20px;
    font-family: system-ui, sans-serif;
  }

  h3 {
    margin-top: 0;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 20px;
  }

  .lanes {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 30px;
  }

  .lane-wrapper {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  .info {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
  }

  h4 {
    margin-top: 0;
    color: #333;
  }

  .lane-info {
    margin-bottom: 15px;
  }

  .lane-info:last-child {
    margin-bottom: 0;
  }

  .selected {
    color: #ff9500;
    font-weight: 600;
  }

  .keyframe-list {
    margin-top: 5px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .keyframe-chip {
    background: #e0e0e0;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    color: #555;
  }

  .readonly-notice {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 10px;
    border-radius: 4px;
    margin-top: 20px;
    color: #856404;
  }
</style>
