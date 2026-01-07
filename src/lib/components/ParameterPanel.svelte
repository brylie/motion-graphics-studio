<script lang="ts">
  import { onMount } from "svelte";
  import { timeline, timelineView } from "$lib/stores/timeline";
  import { getParameterValue } from "$lib/timeline/types";
  import type { Clip } from "$lib/timeline/types";

  let selectedClip: Clip | null = null;
  let fileInput: HTMLInputElement;
  let imagePreview: string | null = null;

  // Subscribe to selected clip changes
  $: {
    const clipId = $timelineView.selectedClipId;
    if (clipId) {
      for (const track of $timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          selectedClip = clip;
          break;
        }
      }
    } else {
      selectedClip = null;
    }
  }

  function handleImageSelect() {
    fileInput.click();
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          imagePreview = event.target.result as string;
          // TODO: Store image data with clip
          console.log("Image loaded:", file.name);
        }
      };

      reader.readAsDataURL(file);
    }
  }

  function getParameterDisplay(name: string, value: any): string {
    if (typeof value === "number") {
      return value.toFixed(2);
    } else if (Array.isArray(value)) {
      return `[${value.map((v) => v.toFixed(2)).join(", ")}]`;
    } else if (typeof value === "boolean") {
      return value ? "On" : "Off";
    }
    return String(value);
  }
</script>

<div class="parameter-panel">
  <div class="panel-header">
    <h3>Parameters</h3>
  </div>

  {#if selectedClip}
    <div class="panel-content">
      <div class="clip-info">
        <div class="info-row">
          <span class="label">Shader:</span>
          <span class="value">{selectedClip.shaderId || "None"}</span>
        </div>
        <div class="info-row">
          <span class="label">Start:</span>
          <span class="value">{selectedClip.startTime.toFixed(2)}s</span>
        </div>
        <div class="info-row">
          <span class="label">Duration:</span>
          <span class="value">{selectedClip.duration.toFixed(2)}s</span>
        </div>
        <div class="info-row">
          <span class="label">Alpha:</span>
          <span class="value">{selectedClip.alpha.toFixed(2)}</span>
        </div>
      </div>

      <div class="parameters-section">
        <h4>Shader Parameters</h4>

        {#if selectedClip.shaderId === "Image.fs"}
          <div class="parameter-group">
            <span class="param-label">Image Source</span>
            <button class="image-select-btn" on:click={handleImageSelect}>
              {imagePreview ? "Change Image" : "Select Image"}
            </button>
            <input
              type="file"
              bind:this={fileInput}
              on:change={handleFileChange}
              accept="image/*"
              style="display: none;"
            />
            {#if imagePreview}
              <div class="image-preview">
                <img src={imagePreview} alt="Selected" />
              </div>
            {/if}
          </div>
        {/if}

        {#if Object.keys(selectedClip.parameters).length > 0}
          {#each Object.entries(selectedClip.parameters) as [name, value]}
            <div class="parameter-row">
              <span class="param-name">{name}:</span>
              <span class="param-value">{getParameterDisplay(name, value)}</span
              >
            </div>
          {/each}
        {:else}
          <p class="empty-state">No parameters available</p>
        {/if}
      </div>

      <div class="automation-section">
        <h4>Automation</h4>
        {#if selectedClip.automation && Object.keys(selectedClip.automation).length > 0}
          {#each Object.entries(selectedClip.automation) as [param, curve]}
            <div class="automation-row">
              <span class="param-name">{param}</span>
              <span class="keyframe-count"
                >{curve.keyframes.length} keyframes</span
              >
            </div>
          {/each}
        {:else}
          <p class="empty-state">No automation curves</p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="empty-panel">
      <p>Select a clip to view parameters</p>
    </div>
  {/if}
</div>

<style>
  .parameter-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
    border-left: 1px solid #444;
    overflow: hidden;
  }

  .panel-header {
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border-bottom: 1px solid #444;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #fff;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .clip-info {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #2a2a2a;
    border-radius: 4px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .info-row:last-child {
    margin-bottom: 0;
  }

  .label {
    color: #888;
  }

  .value {
    color: #ccc;
    font-weight: 500;
  }

  .parameters-section,
  .automation-section {
    margin-bottom: 1.5rem;
  }

  .parameters-section h4,
  .automation-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .parameter-group {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #2a2a2a;
    border-radius: 4px;
  }

  .param-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #aaa;
  }

  .image-select-btn {
    width: 100%;
    padding: 0.5rem;
    background: #4a7ba7;
    border: 1px solid #6a9fc7;
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .image-select-btn:hover {
    background: #5a8bb7;
  }

  .image-preview {
    margin-top: 0.75rem;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #444;
  }

  .image-preview img {
    width: 100%;
    height: auto;
    display: block;
  }

  .parameter-row,
  .automation-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    margin-bottom: 0.25rem;
    background: #2a2a2a;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .param-name {
    color: #aaa;
  }

  .param-value {
    color: #ccc;
    font-family: monospace;
  }

  .keyframe-count {
    color: #6a9fc7;
    font-size: 0.8rem;
  }

  .empty-state {
    color: #666;
    font-size: 0.85rem;
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  .empty-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-panel p {
    color: #666;
    font-size: 0.9rem;
  }
</style>
