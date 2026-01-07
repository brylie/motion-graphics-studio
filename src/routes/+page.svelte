<script lang="ts">
  import PlaybackControls from "$lib/components/PlaybackControls.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
  import ShaderLibrary from "$lib/components/ShaderLibrary.svelte";
  import Preview from "$lib/components/Preview.svelte";
  import ParameterPanel from "$lib/components/ParameterPanel.svelte";
  import { timelineActions } from "$lib/stores/timeline";
  import { onMount } from "svelte";

  onMount(() => {
    // Add a few initial tracks
    timelineActions.addTrack();
    timelineActions.addTrack();
  });
</script>

<div class="app-container">
  <div class="app-header">
    <h1>ISF Timeline Sequencer</h1>
  </div>

  <PlaybackControls />

  <div class="app-content">
    <div class="left-panel">
      <ShaderLibrary />
    </div>

    <div class="main-area">
      <div class="preview-area">
        <Preview />
      </div>
      <div class="timeline-area">
        <Timeline />
      </div>
    </div>

    <div class="right-panel">
      <ParameterPanel />
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
    background: #1a1a1a;
    color: #ccc;
    overflow: hidden;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  .app-header {
    background: #2a2a2a;
    border-bottom: 1px solid #444;
    padding: 0.75rem 1rem;
  }

  .app-header h1 {
    margin: 0;
    font-size: 1.3rem;
    color: #fff;
    font-weight: 600;
  }

  .app-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .left-panel {
    width: 300px;
    border-right: 1px solid #444;
    overflow: hidden;
  }

  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .right-panel {
    width: 300px;
    border-left: 1px solid #444;
    overflow: hidden;
  }

  .preview-area {
    height: 50%;
    border-bottom: 1px solid #444;
    overflow: hidden;
  }

  .timeline-area {
    height: 50%;
    overflow: hidden;
  }
</style>
