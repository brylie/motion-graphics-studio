<script lang="ts">
  import { getContext } from "svelte";
  import type { Readable } from "svelte/store";
  import type { PlaybackState, TimelineViewState } from "$lib/timeline/types";
  import {
    PLAYBACK_CONTEXT,
    FORMATTED_TIME_CONTEXT,
    TIMELINE_VIEW_CONTEXT,
    PLAYBACK_ACTIONS_CONTEXT,
    VIEW_ACTIONS_CONTEXT,
  } from "$lib/constants/contexts";

  // Get stores and actions from context
  const playback = getContext<Readable<PlaybackState>>(PLAYBACK_CONTEXT);
  const formattedTime = getContext<Readable<string>>(FORMATTED_TIME_CONTEXT);
  const timelineView = getContext<Readable<TimelineViewState>>(
    TIMELINE_VIEW_CONTEXT
  );

  const playbackActions = getContext<{
    togglePlay: () => void;
    stop: () => void;
    toggleLoop: () => void;
  }>(PLAYBACK_ACTIONS_CONTEXT);

  const viewActions = getContext<{
    setZoom: (zoom: number) => void;
    setScroll: (scroll: number) => void;
  }>(VIEW_ACTIONS_CONTEXT);

  function handlePlayPause() {
    playbackActions.togglePlay();
  }

  function handleStop() {
    playbackActions.stop();
  }

  function handleLoop() {
    playbackActions.toggleLoop();
  }

  function handleZoomIn() {
    viewActions.setZoom($timelineView.pixelsPerSecond * 1.2);
  }

  function handleZoomOut() {
    viewActions.setZoom($timelineView.pixelsPerSecond * 0.8);
  }

  function handleZoomFit() {
    viewActions.setZoom(50);
    viewActions.setScroll(0);
  }
</script>

<div class="playback-controls">
  <div class="transport">
    <button class="control-btn" on:click={handleStop} title="Stop">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="4" y="4" width="8" height="8" fill="currentColor" />
      </svg>
    </button>

    <button
      class="control-btn play-btn"
      on:click={handlePlayPause}
      title={$playback.isPlaying ? "Pause" : "Play"}
    >
      {#if $playback.isPlaying}
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="4" y="3" width="3" height="10" fill="currentColor" />
          <rect x="9" y="3" width="3" height="10" fill="currentColor" />
        </svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M5 3 L5 13 L13 8 Z" fill="currentColor" />
        </svg>
      {/if}
    </button>

    <button
      class="control-btn"
      class:active={$playback.loop}
      on:click={handleLoop}
      title="Loop"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path
          d="M4 6 L4 10 L8 10 L8 12 L2 9 L8 6 L8 8 L6 8 L6 6 Z M12 6 L12 10 L8 10 L8 12 L14 9 L8 6 L8 8 L10 8 L10 6 Z"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>

  <div class="time-display">
    {$formattedTime}
  </div>

  <div class="zoom-controls">
    <button class="control-btn" on:click={handleZoomOut} title="Zoom Out">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle
          cx="7"
          cy="7"
          r="5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="4"
          y1="7"
          x2="10"
          y2="7"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="11"
          y1="11"
          x2="14"
          y2="14"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    </button>

    <span class="zoom-label"
      >{Math.round($timelineView.pixelsPerSecond)}px/s</span
    >

    <button class="control-btn" on:click={handleZoomIn} title="Zoom In">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle
          cx="7"
          cy="7"
          r="5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="4"
          y1="7"
          x2="10"
          y2="7"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="7"
          y1="4"
          x2="7"
          y2="10"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="11"
          y1="11"
          x2="14"
          y2="14"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    </button>

    <button class="control-btn" on:click={handleZoomFit} title="Zoom to Fit">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="5"
          y1="8"
          x2="11"
          y2="8"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <line
          x1="8"
          y1="5"
          x2="8"
          y2="11"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    </button>
  </div>
</div>

<style>
  .playback-controls {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border-bottom: 1px solid #444;
  }

  .transport,
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-btn {
    padding: 0.5rem;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 4px;
    color: #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .control-btn:hover {
    background: #333;
    border-color: #555;
    color: #fff;
  }

  .control-btn.active {
    background: #4a7ba7;
    border-color: #6a9fc7;
    color: #fff;
  }

  .play-btn {
    background: #4a7ba7;
    border-color: #6a9fc7;
    color: #fff;
  }

  .play-btn:hover {
    background: #5a8bb7;
  }

  .time-display {
    font-family: "Monaco", "Courier New", monospace;
    font-size: 1.1rem;
    color: #fff;
    background: #1e1e1e;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid #444;
    min-width: 100px;
    text-align: center;
  }

  .zoom-label {
    font-size: 0.85rem;
    color: #aaa;
    min-width: 50px;
    text-align: center;
  }
</style>
