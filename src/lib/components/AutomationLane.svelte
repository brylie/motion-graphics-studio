<script lang="ts">
  import type { Keyframe } from "$lib/timeline/types";
  import { moveKeyframe, findKeyframeIndex } from "$lib/utils/keyframes";
  import {
    renderAutomationLane as renderAutomationLaneUtil,
    hitTestKeyframe,
    yToValue as yToValueUtil,
  } from "$lib/utils/automationRendering";

  export let parameterName: string;
  export let keyframes: Keyframe[] = [];
  export let clipDuration: number;
  export let pixelsPerSecond: number;
  export let laneHeight: number = 40;
  export let keyframeSize: number = 8;
  export let selectedKeyframeTime: number | null = null;
  export let readonly: boolean = false;
  export let clipXOffset: number = 0; // X offset for positioning within timeline
  export let canvasWidth: number | undefined = undefined; // Optional fixed width

  // Callbacks instead of events
  export let onkeyframeselect:
    | ((detail: { time: number }) => void)
    | undefined = undefined;
  export let onkeyframemove:
    | ((detail: { oldTime: number; newTime: number; newValue: number }) => void)
    | undefined = undefined;
  export let onkeyframeadd:
    | ((detail: { time: number; value: number }) => void)
    | undefined = undefined;
  export let onkeyframeremove:
    | ((detail: { time: number }) => void)
    | undefined = undefined;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  $: width = canvasWidth ?? clipDuration * pixelsPerSecond;
  $: height = laneHeight;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartTime = 0;
  let dragStartValue = 0;

  $: {
    if (canvas) {
      ctx = canvas.getContext("2d");
      render();
    }
  }

  $: if (keyframes || selectedKeyframeTime !== null) {
    render();
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Use shared rendering utility for consistent appearance
    renderAutomationLaneUtil({
      ctx,
      keyframes,
      x: 0,
      y: 0,
      width,
      height,
      pixelsPerSecond,
      minValue: 0,
      maxValue: 1,
      selectedKeyframeTime,
      keyframeSize,
      parameterName,
      keyframeShape: "circle", // AutomationLane uses circles, Timeline uses diamonds
    });
  }

  function handleMouseDown(e: MouseEvent) {
    if (readonly) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a keyframe
    const clickedKeyframe = getKeyframeAtPosition(x, y);

    if (clickedKeyframe !== null) {
      onkeyframeselect?.({ time: clickedKeyframe.time });
      isDragging = true;
      dragStartX = x;
      dragStartY = y;
      dragStartTime = clickedKeyframe.time;
      dragStartValue = clickedKeyframe.value;
    } else {
      // Clicking empty space - could add keyframe in future
      onkeyframeselect?.({ time: -1 }); // Deselect
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || selectedKeyframeTime === null) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;
    const desiredTime = dragStartTime + deltaTime;

    // Calculate value from Y position using shared utility
    const desiredValue = yToValueUtil(y, 0, height, 0, 1);

    try {
      const { time: clampedTime, value: clampedValue } = moveKeyframe(
        keyframes,
        selectedKeyframeTime,
        desiredTime,
        desiredValue,
        {
          minTime: 0,
          maxTime: clipDuration,
          minValue: 0,
          maxValue: 1,
          snapGrid: 0.1,
        }
      );

      const timeChanged = Math.abs(clampedTime - selectedKeyframeTime) > 0.01;
      const kfIndex = findKeyframeIndex(keyframes, selectedKeyframeTime);
      const valueChanged =
        kfIndex !== -1 &&
        Math.abs(clampedValue - keyframes[kfIndex].value) > 0.01;

      if (timeChanged || valueChanged) {
        onkeyframemove?.({
          oldTime: selectedKeyframeTime,
          newTime: clampedTime,
          newValue: clampedValue,
        });
      }
    } catch (error) {
      console.warn("Error moving keyframe:", error);
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function getKeyframeAtPosition(x: number, y: number): Keyframe | null {
    // Use shared hit-test utility
    return hitTestKeyframe(
      keyframes,
      x,
      y,
      0,
      0,
      height,
      pixelsPerSecond,
      keyframeSize,
      0,
      1
    );
  }

  // Export hit-test function for Timeline to use
  export function hitTestKeyframeGlobal(
    globalX: number,
    globalY: number,
    laneY: number
  ): Keyframe | null {
    // Convert global coordinates to local lane coordinates
    const localX = globalX - clipXOffset;
    const localY = globalY - laneY;
    return getKeyframeAtPosition(localX, localY);
  }

  // Expose for testing
  export function getKeyframeCount(): number {
    return keyframes.length;
  }
</script>

/** * AutomationLane Component * * Handles interaction with a single automation
curve (keyframes for one parameter). * This component is isolated and testable
to ensure consistent behavior across * multiple automation lanes. */
<div class="automation-lane">
  <div class="parameter-name">{parameterName}</div>
  <canvas
    bind:this={canvas}
    {width}
    {height}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    style="display: block; cursor: {isDragging ? 'grabbing' : 'default'};"
  ></canvas>
</div>

<style>
  .automation-lane {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .parameter-name {
    font-size: 12px;
    color: #666;
    padding: 2px 4px;
  }

  canvas {
    image-rendering: pixelated;
  }
</style>
