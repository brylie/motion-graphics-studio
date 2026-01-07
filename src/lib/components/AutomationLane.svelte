<script lang="ts">
  import type { Keyframe } from "$lib/timeline/types";
  import { moveKeyframe, findKeyframeIndex } from "$lib/utils/keyframes";

  export let parameterName: string;
  export let keyframes: Keyframe[] = [];
  export let clipDuration: number;
  export let pixelsPerSecond: number;
  export let laneHeight: number = 40;
  export let keyframeSize: number = 5;
  export let selectedKeyframeTime: number | null = null;
  export let readonly: boolean = false;

  // Callbacks instead of events
  export let onkeyframeselect:
    | ((detail: { time: number }) => void)
    | undefined = undefined;
  export let onkeyframemove:
    | ((detail: { oldTime: number; newTime: number; newValue: number }) => void)
    | undefined = undefined;

  $: width = clipDuration * pixelsPerSecond;
  // Reserve space for parameter name label (approximately 14px)
  $: height = laneHeight - 14;

  let isDragging = false;
  let draggedKeyframeTime: number | null = null;
  let svgElement: SVGSVGElement;

  // Convert keyframe time to X coordinate
  function timeToX(time: number): number {
    const x = time * pixelsPerSecond;
    return x;
  }

  // Convert keyframe value (0-1) to Y coordinate (inverted, 0 at top)
  function valueToY(value: number): number {
    const padding = 8;
    return padding + (1 - value) * (height - padding * 2);
  }

  // Convert X coordinate to time
  function xToTime(x: number): number {
    return x / pixelsPerSecond;
  }

  // Convert Y coordinate to value
  function yToValue(y: number): number {
    const padding = 8;
    const normalizedY = (y - padding) / (height - padding * 2);
    return Math.max(0, Math.min(1, 1 - normalizedY));
  }

  // Generate SVG path for automation curve
  $: pathData = (() => {
    if (keyframes.length === 0) return "";

    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
    let path = "";

    sortedKeyframes.forEach((kf, i) => {
      const x = timeToX(kf.time);
      const y = valueToY(kf.value);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    return path;
  })();

  function handleSvgMouseDown(e: MouseEvent) {
    if (readonly) return;
    // Only handle if clicking on background (not on keyframes)
    // Keyframes have their own handlers now
    if (
      e.target === svgElement ||
      (e.target as SVGElement).classList.contains("background") ||
      (e.target as SVGElement).classList.contains("grid-line")
    ) {
      onkeyframeselect?.({ time: -1 }); // Deselect
    }
  }

  function handleKeyframeMouseDown(e: MouseEvent, kf: Keyframe) {
    if (readonly) return;
    e.stopPropagation();

    onkeyframeselect?.({ time: kf.time });
    isDragging = true;
    draggedKeyframeTime = kf.time;
  }

  function handleSvgMouseMove(e: MouseEvent) {
    if (!isDragging || draggedKeyframeTime === null) return;

    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const desiredTime = xToTime(x);
    const desiredValue = yToValue(y);

    try {
      const { time: clampedTime, value: clampedValue } = moveKeyframe(
        keyframes,
        draggedKeyframeTime,
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

      const timeChanged = Math.abs(clampedTime - draggedKeyframeTime) > 0.01;
      const kfIndex = findKeyframeIndex(keyframes, draggedKeyframeTime);
      const valueChanged =
        kfIndex !== -1 &&
        Math.abs(clampedValue - keyframes[kfIndex].value) > 0.01;

      if (timeChanged || valueChanged) {
        onkeyframemove?.({
          oldTime: draggedKeyframeTime,
          newTime: clampedTime,
          newValue: clampedValue,
        });
        draggedKeyframeTime = clampedTime;
      }
    } catch (error) {
      console.warn("Error moving keyframe:", error);
    }
  }

  function handleSvgMouseUp() {
    isDragging = false;
    draggedKeyframeTime = null;
  }

  // Expose for testing
  export function getKeyframeCount(): number {
    return keyframes.length;
  }
</script>

<div class="automation-lane">
  <div class="parameter-name">{parameterName}</div>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    bind:this={svgElement}
    {width}
    {height}
    class="automation-svg"
    class:dragging={isDragging}
    class:readonly
    on:mousedown={handleSvgMouseDown}
    on:mousemove={handleSvgMouseMove}
    on:mouseup={handleSvgMouseUp}
    on:mouseleave={handleSvgMouseUp}
    role="application"
    aria-label="Automation curve for {parameterName}"
  >
    <!-- Background -->
    <rect {width} {height} class="background" />

    <!-- Grid lines (optional) -->
    <line x1="0" y1={height / 2} x2={width} y2={height / 2} class="grid-line" />

    <!-- Automation curve path -->
    {#if pathData}
      <path
        d={pathData}
        class="automation-path"
        fill="none"
        stroke="#60a5fa"
        stroke-width="2"
      />
    {/if}

    <!-- Keyframes -->
    {#each keyframes as kf (kf.time)}
      <g class="keyframe-group">
        <!-- Invisible larger hit area -->
        <circle
          cx={timeToX(kf.time)}
          cy={valueToY(kf.value)}
          r={keyframeSize * 2}
          class="keyframe-hitarea"
          role="button"
          tabindex="0"
          aria-label="Keyframe at {kf.time.toFixed(
            2
          )}s, value {kf.value.toFixed(2)}"
          on:mousedown={(e) => handleKeyframeMouseDown(e, kf)}
        />
        <!-- Visible keyframe -->
        <circle
          cx={timeToX(kf.time)}
          cy={valueToY(kf.value)}
          r={keyframeSize}
          class="keyframe"
          class:selected={selectedKeyframeTime === kf.time}
          class:readonly
          role="button"
          tabindex="0"
          aria-label="Keyframe at {kf.time.toFixed(
            2
          )}s, value {kf.value.toFixed(2)}"
          on:mousedown={(e) => handleKeyframeMouseDown(e, kf)}
        />
      </g>
    {/each}
  </svg>
</div>

<style>
  .automation-lane {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
  }

  .parameter-name {
    font-size: 10px;
    color: #9ca3af;
    padding: 2px 4px;
    font-weight: 500;
    line-height: 1;
    flex-shrink: 0;
  }

  .automation-svg {
    display: block;
    cursor: default;
    flex: 1;
  }

  .automation-svg.dragging {
    cursor: grabbing;
  }

  .automation-svg:not(.readonly) {
    cursor: crosshair;
  }

  .background {
    fill: #1f2937;
    stroke: #374151;
    stroke-width: 1;
  }

  .grid-line {
    stroke: #374151;
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.5;
  }

  .automation-path {
    stroke: #60a5fa;
    stroke-width: 2;
    fill: none;
  }

  .keyframe-group {
    cursor: grab;
  }

  .keyframe-group:active {
    cursor: grabbing;
  }

  .keyframe-hitarea {
    fill: transparent;
    stroke: none;
    cursor: grab;
  }

  .keyframe {
    fill: #60a5fa;
    stroke: #1e3a8a;
    stroke-width: 2;
    cursor: grab;
  }

  .keyframe.selected {
    fill: #3b82f6;
    stroke: #1e40af;
    stroke-width: 3;
  }

  .keyframe.readonly {
    cursor: default;
    pointer-events: none;
  }

  .keyframe:active {
    cursor: grabbing;
  }
</style>
