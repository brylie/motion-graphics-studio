<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { timeline } from "$lib/stores/timeline";
  import { playback, playbackActions } from "$lib/stores/playback";
  import { shaderLibrary } from "$lib/stores/shaders";
  import { CompositionRenderer } from "$lib/composition/renderer";

  let canvas: HTMLCanvasElement;
  let renderer: CompositionRenderer | null = null;
  let animationFrameId: number | null = null;
  let lastTime = 0;
  let isInitialized = false;

  const width = 1920;
  const height = 1080;
  const displayWidth = 960;
  const displayHeight = 540;

  async function initializeRenderer() {
    if (!canvas || isInitialized) return;

    try {
      renderer = new CompositionRenderer(canvas, width, height);

      // Load all shaders from the library
      for (const shader of $shaderLibrary.shaders) {
        await renderer.loadShader(shader.filename, shader);
      }

      isInitialized = true;
      console.log("Composition renderer initialized");
    } catch (error) {
      console.error("Failed to initialize renderer:", error);
    }
  }

  function renderFrame(currentTime: number) {
    if (!renderer || !isInitialized) return;

    // Calculate delta time
    const deltaTime = lastTime > 0 ? (currentTime - lastTime) / 1000 : 0;
    lastTime = currentTime;

    // Update playback time if playing
    if ($playback.isPlaying) {
      playbackActions.updateTime(deltaTime);
    }

    // Render composition at current time
    renderer.render($timeline, $playback.currentTime);

    // Continue animation loop
    animationFrameId = requestAnimationFrame(renderFrame);
  }

  function startAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    lastTime = 0;
    animationFrameId = requestAnimationFrame(renderFrame);
  }

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  onMount(async () => {
    // Wait for shaders to load
    const unsubscribe = shaderLibrary.subscribe(async (lib) => {
      if (lib.shaders.length > 0 && !isInitialized) {
        await initializeRenderer();
        startAnimation();
      }
    });

    return () => {
      unsubscribe();
    };
  });

  onDestroy(() => {
    stopAnimation();
    if (renderer) {
      renderer.destroy();
    }
  });
</script>

<div class="preview-container">
  <div class="preview-header">
    <h3>Preview</h3>
    <span class="resolution">{width}x{height}</span>
  </div>
  <div class="preview-content">
    <canvas
      bind:this={canvas}
      width={displayWidth}
      height={displayHeight}
      style="width: {displayWidth}px; height: {displayHeight}px;"
    ></canvas>
  </div>
</div>

<style>
  .preview-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 4px;
    overflow: hidden;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border-bottom: 1px solid #444;
  }

  .preview-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #fff;
  }

  .resolution {
    font-size: 0.85rem;
    color: #888;
    font-family: monospace;
  }

  .preview-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    padding: 1rem;
  }

  canvas {
    display: block;
    background: #000;
    border: 1px solid #333;
  }
</style>
