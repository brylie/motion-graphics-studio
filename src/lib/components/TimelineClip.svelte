<script lang="ts">
  import type { Clip } from "$lib/timeline/types";
  import { timelineView, viewActions } from "$lib/stores/timeline";
  import { createEventDispatcher } from "svelte";

  export let clip: Clip;
  export let pixelsPerSecond: number;
  export let isSelected: boolean = false;

  const dispatch = createEventDispatcher<{
    select: { clipId: string };
    dragstart: { clipId: string; startX: number };
    resizestart: { clipId: string; handle: "left" | "right"; startX: number };
  }>();

  let isDragging = false;
  let isResizingLeft = false;
  let isResizingRight = false;

  $: left = clip.startTime * pixelsPerSecond;
  $: width = clip.duration * pixelsPerSecond;

  function handleClipClick(e: MouseEvent) {
    if (isResizingLeft || isResizingRight) return;
    e.stopPropagation();
    dispatch("select", { clipId: clip.id });
  }

  function handleClipMouseDown(e: MouseEvent) {
    if (isResizingLeft || isResizingRight) return;
    e.stopPropagation();
    isDragging = true;
    dispatch("dragstart", { clipId: clip.id, startX: e.clientX });
  }

  function handleLeftResizeMouseDown(e: MouseEvent) {
    e.stopPropagation();
    isResizingLeft = true;
    dispatch("resizestart", {
      clipId: clip.id,
      handle: "left",
      startX: e.clientX,
    });

    // Add window-level mouseup listener to reset state
    const handleMouseUp = () => {
      isResizingLeft = false;
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleRightResizeMouseDown(e: MouseEvent) {
    e.stopPropagation();
    isResizingRight = true;
    dispatch("resizestart", {
      clipId: clip.id,
      handle: "right",
      startX: e.clientX,
    });

    // Add window-level mouseup listener to reset state
    const handleMouseUp = () => {
      isResizingRight = false;
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mouseup", handleMouseUp);
  }
</script>

<div
  class="timeline-clip"
  class:selected={isSelected}
  data-clip-id={clip.id}
  style="left: {left}px; width: {width}px;"
  on:click={handleClipClick}
  on:mousedown={handleClipMouseDown}
  on:keydown={(e) => e.key === "Enter" && handleClipClick(e as any)}
  role="button"
  tabindex="0"
  aria-label="{clip.shaderName} clip from {clip.startTime}s for {clip.duration}s"
>
  <div class="clip-content">
    <span class="clip-name">{clip.shaderName}</span>
    <span class="clip-duration">{clip.duration.toFixed(2)}s</span>
  </div>

  {#if isSelected}
    <div
      class="resize-handle left"
      on:mousedown={handleLeftResizeMouseDown}
      role="button"
      tabindex="0"
      aria-label="Resize left edge"
    ></div>
    <div
      class="resize-handle right"
      on:mousedown={handleRightResizeMouseDown}
      role="button"
      tabindex="0"
      aria-label="Resize right edge"
    ></div>
  {/if}
</div>

<style>
  .timeline-clip {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
    border: 2px solid #4a5568;
    border-radius: 4px;
    cursor: grab;
    user-select: none;
    display: flex;
    align-items: center;
    padding: 0 8px;
    transition: border-color 0.15s ease;
    min-width: 20px;
    overflow: hidden;
  }

  .timeline-clip:hover {
    border-color: #60a5fa;
  }

  .timeline-clip.selected {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #5a6f88 0%, #3d4758 100%);
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .timeline-clip:active {
    cursor: grabbing;
  }

  .clip-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 6px;
    color: white;
    font-size: 11px;
    pointer-events: none;
  }

  .clip-name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .clip-duration {
    color: #a0aec0;
    white-space: nowrap;
    font-size: 10px;
  }

  .resize-handle {
    position: absolute;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
    z-index: 10;
  }

  .resize-handle.left {
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 100%
    );
  }

  .resize-handle.right {
    right: 0;
    background: linear-gradient(
      270deg,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 100%
    );
  }

  .resize-handle:hover {
    background: rgba(96, 165, 250, 0.4);
  }

  .resize-handle:active {
    background: rgba(59, 130, 246, 0.6);
  }
</style>
