<script lang="ts">
  import type { Keyframe } from "$lib/timeline/types";
  import { moveKeyframe, findKeyframeIndex } from "$lib/utils/keyframes";

  export let parameterName: string;
  export let keyframes: Keyframe[] = [];
  export let clipDuration: number;
  export let pixelsPerSecond: number;
  export let laneHeight: number = 40;
  export let keyframeSize: number = 8;
  export let selectedKeyframeTime: number | null = null;
  export let readonly: boolean = false;

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
  let width = 800;
  let height = laneHeight;

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

    // Background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Parameter label
    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(parameterName, 5, 12);

    if (keyframes.length === 0) return;

    // Draw curve line
    ctx.strokeStyle = "#4a9eff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    keyframes.forEach((keyframe, i) => {
      const kfX = keyframe.time * pixelsPerSecond;
      const kfY = height - keyframe.value * (height - 4) - 2;

      if (i === 0) {
        ctx!.moveTo(kfX, kfY);
      } else {
        ctx!.lineTo(kfX, kfY);
      }
    });

    ctx.stroke();

    // Draw keyframes
    keyframes.forEach((keyframe) => {
      const kfX = keyframe.time * pixelsPerSecond;
      const kfY = height - keyframe.value * (height - 4) - 2;

      const isSelected =
        selectedKeyframeTime !== null &&
        Math.abs(keyframe.time - selectedKeyframeTime) < 0.01;

      ctx!.fillStyle = isSelected ? "#ff9500" : "#4a9eff";
      ctx!.beginPath();
      ctx!.arc(kfX, kfY, keyframeSize / 2, 0, Math.PI * 2);
      ctx!.fill();

      // Outline
      ctx!.strokeStyle = "#fff";
      ctx!.lineWidth = 1;
      ctx!.stroke();
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

    // Calculate value from Y delta (inverted: up = positive, down = negative)
    const deltaY = dragStartY - y; // Inverted because canvas Y increases downward
    const deltaValue = deltaY / height;
    const desiredValue = dragStartValue + deltaValue;

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
    for (const keyframe of keyframes) {
      const kfX = keyframe.time * pixelsPerSecond;
      const kfY = height - keyframe.value * (height - 4) - 2;

      const dx = x - kfX;
      const dy = y - kfY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < keyframeSize) {
        return keyframe;
      }
    }
    return null;
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
  />
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
