<script lang="ts">
  import { moveKeyframe, validateKeyframes, type Keyframe } from "./keyframes";

  let keyframes: Keyframe[] = [
    { time: 2, value: 0.3 },
    { time: 5, value: 0.6 },
    { time: 8, value: 0.9 },
  ];

  let selectedIndex = -1;
  let draggedKeyframe: Keyframe | null = null;
  let isDragging = false;

  let canvasWidth = 800;
  let canvasHeight = 200;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  const CLIP_DURATION = 10;
  const MARGIN = 50;
  const TIMELINE_WIDTH = canvasWidth - MARGIN * 2;
  const TIMELINE_Y = canvasHeight / 2;
  const KEYFRAME_RADIUS = 8;

  $: validation = validateKeyframes(keyframes);

  function timeToX(time: number): number {
    return MARGIN + (time / CLIP_DURATION) * TIMELINE_WIDTH;
  }

  function valueToY(value: number): number {
    const valueHeight = canvasHeight * 0.6;
    const topMargin = (canvasHeight - valueHeight) / 2;
    return topMargin + (1 - value) * valueHeight;
  }

  function xToTime(x: number): number {
    return Math.max(
      0,
      Math.min(CLIP_DURATION, ((x - MARGIN) / TIMELINE_WIDTH) * CLIP_DURATION)
    );
  }

  function yToValue(y: number): number {
    const valueHeight = canvasHeight * 0.6;
    const topMargin = (canvasHeight - valueHeight) / 2;
    return Math.max(0, Math.min(1, 1 - (y - topMargin) / valueHeight));
  }

  function draw() {
    const context = ctx;
    if (!context) return;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background
    context.fillStyle = "#1a1a1a";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw timeline
    context.strokeStyle = "#555";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(MARGIN, TIMELINE_Y);
    context.lineTo(canvasWidth - MARGIN, TIMELINE_Y);
    context.stroke();

    // Draw time markers
    context.fillStyle = "#888";
    context.font = "12px monospace";
    context.textAlign = "center";
    for (let t = 0; t <= CLIP_DURATION; t++) {
      const x = timeToX(t);
      context.beginPath();
      context.moveTo(x, TIMELINE_Y - 5);
      context.lineTo(x, TIMELINE_Y + 5);
      context.stroke();
      context.fillText(`${t}s`, x, TIMELINE_Y + 20);
    }

    // Draw value guide lines
    context.strokeStyle = "#333";
    context.lineWidth = 1;
    for (let v = 0; v <= 1; v += 0.25) {
      const y = valueToY(v);
      context.beginPath();
      context.moveTo(MARGIN, y);
      context.lineTo(canvasWidth - MARGIN, y);
      context.stroke();
      context.fillStyle = "#666";
      context.textAlign = "right";
      context.fillText(v.toFixed(2), MARGIN - 10, y + 4);
    }

    // Draw automation curve
    if (keyframes.length > 1) {
      context.strokeStyle = "#4a9eff";
      context.lineWidth = 2;
      context.beginPath();
      keyframes.forEach((kf, i) => {
        const x = timeToX(kf.time);
        const y = valueToY(kf.value);
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
    }

    // Draw keyframes
    keyframes.forEach((kf, i) => {
      const x = timeToX(kf.time);
      const y = valueToY(kf.value);

      context.fillStyle = i === selectedIndex ? "#ffaa00" : "#4a9eff";
      context.strokeStyle = "#fff";
      context.lineWidth = 2;

      context.beginPath();
      context.arc(x, y, KEYFRAME_RADIUS, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      // Draw time/value labels
      context.fillStyle = "#fff";
      context.font = "11px monospace";
      context.textAlign = "center";
      context.fillText(`t:${kf.time.toFixed(1)}`, x, y - 15);
      context.fillText(`v:${kf.value.toFixed(2)}`, x, y + 25);
    });

    // Draw validation errors
    if (!validation.valid) {
      context.fillStyle = "#ff4444";
      context.font = "14px sans-serif";
      context.textAlign = "left";
      context.fillText("⚠ " + validation.errors[0], MARGIN, canvasHeight - 10);
    }
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a keyframe
    for (let i = 0; i < keyframes.length; i++) {
      const kfX = timeToX(keyframes[i].time);
      const kfY = valueToY(keyframes[i].value);
      const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);

      if (distance < KEYFRAME_RADIUS + 5) {
        selectedIndex = i;
        draggedKeyframe = { ...keyframes[i] };
        isDragging = true;
        draw();
        return;
      }
    }

    selectedIndex = -1;
    draw();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !draggedKeyframe || selectedIndex === -1) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const desiredTime = xToTime(x);
    const desiredValue = yToValue(y);

    try {
      const result = moveKeyframe(
        keyframes,
        draggedKeyframe.time,
        desiredTime,
        desiredValue,
        {
          minTime: 0,
          maxTime: CLIP_DURATION,
          minValue: 0,
          maxValue: 1,
          snapGrid: 0.1,
        }
      );

      // Update the keyframe
      keyframes[selectedIndex] = result;
      draggedKeyframe = result;
      keyframes = keyframes; // Trigger reactivity
      draw();
    } catch (err) {
      console.error("Error moving keyframe:", err);
    }
  }

  function handleMouseUp() {
    isDragging = false;
    draggedKeyframe = null;
  }

  function resetKeyframes() {
    keyframes = [
      { time: 2, value: 0.3 },
      { time: 5, value: 0.6 },
      { time: 8, value: 0.9 },
    ];
    selectedIndex = -1;
    draw();
  }

  $: if (ctx) draw();

  import { onMount } from "svelte";
  onMount(() => {
    ctx = canvas.getContext("2d");
    draw();
  });
</script>

<div class="keyframe-demo">
  <h2>Keyframe Dragging with Clamping</h2>
  <p>Try dragging keyframes! They cannot be moved past their neighbors.</p>

  <canvas
    bind:this={canvas}
    width={canvasWidth}
    height={canvasHeight}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
  ></canvas>

  <div class="controls">
    <button on:click={resetKeyframes}>Reset</button>
    <div class="status">
      {#if selectedIndex >= 0}
        Selected: Keyframe {selectedIndex + 1}
      {:else}
        Click a keyframe to select
      {/if}
    </div>
  </div>

  <div class="info">
    <h3>Features:</h3>
    <ul>
      <li>✓ Keyframes are clamped to prevent overlap (minimum 0.02s gap)</li>
      <li>✓ Time snaps to 0.1s grid</li>
      <li>✓ Values constrained to 0-1 range</li>
      <li>✓ Selected keyframe highlighted in orange</li>
      <li>✓ Validation errors shown at bottom</li>
    </ul>

    <h3>Current Keyframes:</h3>
    <ul>
      {#each keyframes as kf, i}
        <li class:selected={i === selectedIndex}>
          Keyframe {i + 1}: time={kf.time.toFixed(2)}s, value={kf.value.toFixed(
            3
          )}
        </li>
      {/each}
    </ul>

    {#if !validation.valid}
      <div class="errors">
        <h4>Validation Errors:</h4>
        <ul>
          {#each validation.errors as error}
            <li>{error}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .keyframe-demo {
    padding: 2rem;
    background: #0a0a0a;
    color: #eee;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  h2 {
    margin: 0 0 0.5rem;
    color: #4a9eff;
  }

  p {
    margin: 0 0 1rem;
    color: #999;
  }

  canvas {
    display: block;
    border: 2px solid #333;
    border-radius: 4px;
    cursor: crosshair;
    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 2rem;
  }

  button {
    padding: 0.5rem 1rem;
    background: #4a9eff;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  button:hover {
    background: #3a8eef;
  }

  .status {
    padding: 0.5rem 1rem;
    background: #222;
    border-radius: 4px;
    font-family: monospace;
  }

  .info {
    background: #151515;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #333;
  }

  h3,
  h4 {
    margin: 0 0 0.75rem;
    color: #4a9eff;
    font-size: 1rem;
  }

  ul {
    margin: 0 0 1.5rem;
    padding-left: 1.5rem;
  }

  ul:last-child {
    margin-bottom: 0;
  }

  li {
    margin-bottom: 0.5rem;
    color: #ccc;
  }

  li.selected {
    color: #ffaa00;
    font-weight: 600;
  }

  .errors {
    background: #331111;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #ff4444;
    margin-top: 1rem;
  }

  .errors h4 {
    color: #ff4444;
  }

  .errors li {
    color: #ffaaaa;
  }
</style>
