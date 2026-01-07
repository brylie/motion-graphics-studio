<script lang="ts">
  import { playback, playbackActions } from "$lib/stores/playback";

  export let duration: number;
  export let pixelsPerSecond: number;

  let isScrubbing = false;
  let rulerElement: HTMLDivElement;

  const RULER_HEIGHT = 30;

  // Calculate time markers based on zoom level
  $: markerInterval = calculateMarkerInterval(pixelsPerSecond);
  $: markers = generateMarkers(duration, markerInterval);
  $: totalWidth = duration * pixelsPerSecond;

  function calculateMarkerInterval(pps: number): number {
    // Adjust marker density based on zoom level
    // More zoomed in = more markers
    if (pps >= 100) return 1; // Every second
    if (pps >= 50) return 2; // Every 2 seconds
    if (pps >= 25) return 5; // Every 5 seconds
    return 10; // Every 10 seconds
  }

  function generateMarkers(
    dur: number,
    interval: number
  ): Array<{ time: number; label: string }> {
    const result: Array<{ time: number; label: string }> = [];
    for (let t = 0; t <= dur; t += interval) {
      result.push({
        time: t,
        label: formatTime(t),
      });
    }
    return result;
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);

    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}.${ms}`;
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = rulerElement.getBoundingClientRect();
    const x =
      e.clientX - rect.left + (rulerElement.parentElement?.scrollLeft || 0);
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    playbackActions.seek(time);
    isScrubbing = true;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isScrubbing) return;
    const rect = rulerElement.getBoundingClientRect();
    const x =
      e.clientX - rect.left + (rulerElement.parentElement?.scrollLeft || 0);
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    playbackActions.seek(time);
  }

  function handleMouseUp() {
    isScrubbing = false;
  }
</script>

<div
  bind:this={rulerElement}
  class="timeline-ruler"
  style="height: {RULER_HEIGHT}px; width: {totalWidth}px;"
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  role="slider"
  tabindex="0"
  aria-label="Timeline scrubber"
  aria-valuemin="0"
  aria-valuemax={duration}
  aria-valuenow={$playback.currentTime}
>
  <!-- Background with grid lines -->
  <div class="ruler-background">
    {#each markers as marker (marker.time)}
      <div class="time-marker" style="left: {marker.time * pixelsPerSecond}px;">
        <div class="tick-line major"></div>
        <span class="time-label">{marker.label}</span>
      </div>
    {/each}

    <!-- Minor tick marks (between major markers) -->
    {#each Array(Math.ceil(duration / (markerInterval / 4))) as _, i}
      {@const time = i * (markerInterval / 4)}
      {#if time % markerInterval !== 0 && time <= duration}
        <div
          class="time-marker minor"
          style="left: {time * pixelsPerSecond}px;"
        >
          <div class="tick-line minor"></div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .timeline-ruler {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 100;
    background: #1f2937;
    border-bottom: 2px solid #374151;
    user-select: none;
    cursor: pointer;
  }

  .timeline-ruler:active {
    cursor: grabbing;
  }

  .ruler-background {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .time-marker {
    position: absolute;
    top: 0;
    height: 100%;
    pointer-events: none;
  }

  .time-marker.minor {
    opacity: 0.5;
  }

  .tick-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    background: #4b5563;
  }

  .tick-line.major {
    height: 12px;
    background: #6b7280;
  }

  .tick-line.minor {
    height: 6px;
    background: #4b5563;
  }

  .time-label {
    position: absolute;
    top: 4px;
    left: 4px;
    font-size: 11px;
    color: #9ca3af;
    font-family: monospace;
    white-space: nowrap;
  }
</style>
