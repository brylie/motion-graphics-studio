<script lang="ts">
  import { onMount } from "svelte";
  import {
    timeline,
    timelineView,
    timelineActions,
  } from "$lib/stores/timeline";
  import { playback } from "$lib/stores/playback";
  import { getParameterValue } from "$lib/timeline/types";
  import type { Clip, Keyframe } from "$lib/timeline/types";

  let selectedClip: Clip | null = null;
  let fileInput: HTMLInputElement;
  let imagePreview: string | null = null;
  let selectedParameter: string | null = null;

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
      selectedParameter = null;
    }
  }

  // Get local time within clip
  $: localTime = selectedClip
    ? Math.max(
        0,
        Math.min(
          $playback.currentTime - selectedClip.startTime,
          selectedClip.duration
        )
      )
    : 0;

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

  function hasKeyframes(paramName: string): boolean {
    if (!selectedClip) return false;
    const curve = selectedClip.automation.find(
      (c) => c.parameterName === paramName
    );
    return curve ? curve.keyframes.length > 0 : false;
  }

  function getKeyframeCount(paramName: string): number {
    if (!selectedClip) return 0;
    const curve = selectedClip.automation.find(
      (c) => c.parameterName === paramName
    );
    return curve ? curve.keyframes.length : 0;
  }

  function hasKeyframeAtCurrentTime(paramName: string): boolean {
    if (!selectedClip) return false;
    const curve = selectedClip.automation.find(
      (c) => c.parameterName === paramName
    );
    if (!curve) return false;
    return curve.keyframes.some((kf) => Math.abs(kf.time - localTime) < 0.01);
  }

  function addKeyframe(paramName: string) {
    if (!selectedClip) return;

    const currentValue = selectedClip.parameters[paramName];
    if (typeof currentValue !== "number") {
      console.warn("Can only animate numeric parameters");
      return;
    }

    timelineActions.addKeyframe(
      selectedClip.id,
      paramName,
      localTime,
      currentValue
    );
  }

  function removeKeyframe(paramName: string) {
    if (!selectedClip) return;
    timelineActions.removeKeyframe(selectedClip.id, paramName, localTime);
  }

  function updateParameterValue(paramName: string, value: number) {
    if (!selectedClip) return;

    if (hasKeyframeAtCurrentTime(paramName)) {
      // Update keyframe value
      timelineActions.updateKeyframe(
        selectedClip.id,
        paramName,
        localTime,
        value
      );
    } else {
      // Update base parameter value
      timelineActions.updateParameter(selectedClip.id, paramName, value);
    }
  }

  function clearAllKeyframes(paramName: string) {
    if (!selectedClip) return;
    timelineActions.clearKeyframes(selectedClip.id, paramName);
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
            {#if typeof value === "number"}
              <div
                class="parameter-row animatable"
                class:selected={selectedParameter === name}
              >
                <div class="param-header">
                  <span class="param-name">{name}</span>
                  <div class="keyframe-controls">
                    {#if hasKeyframes(name)}
                      <span
                        class="keyframe-count"
                        title="{getKeyframeCount(name)} keyframes"
                      >
                        ◆ {getKeyframeCount(name)}
                      </span>
                    {/if}

                    {#if hasKeyframeAtCurrentTime(name)}
                      <button
                        class="keyframe-btn active"
                        on:click={() => removeKeyframe(name)}
                        title="Remove keyframe (current time has keyframe)"
                      >
                        ◆
                      </button>
                    {:else}
                      <button
                        class="keyframe-btn"
                        on:click={() => addKeyframe(name)}
                        title="Add keyframe at current time"
                      >
                        ◇
                      </button>
                    {/if}

                    {#if hasKeyframes(name)}
                      <button
                        class="clear-btn"
                        on:click={() => clearAllKeyframes(name)}
                        title="Clear all keyframes"
                      >
                        ✕
                      </button>
                    {/if}
                  </div>
                </div>

                <div class="param-input">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    {value}
                    on:input={(e) =>
                      updateParameterValue(
                        name,
                        parseFloat(e.currentTarget.value)
                      )}
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    {value}
                    on:input={(e) =>
                      updateParameterValue(
                        name,
                        parseFloat(e.currentTarget.value)
                      )}
                  />
                </div>
              </div>
            {:else}
              <div class="parameter-row">
                <span class="param-name">{name}:</span>
                <span class="param-value"
                  >{getParameterDisplay(name, value)}</span
                >
              </div>
            {/if}
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

  .parameter-row.animatable {
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .parameter-row.animatable:hover {
    background: #333;
    border-color: #555;
  }

  .parameter-row.animatable.selected {
    border-color: #4a9eff;
    background: #2a3a4a;
  }

  .param-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .param-name {
    color: #aaa;
    font-weight: 500;
  }

  .keyframe-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .keyframe-count {
    font-size: 0.85rem;
    color: #4a9eff;
    font-weight: 600;
  }

  .keyframe-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    background: #444;
    border: 1px solid #666;
    border-radius: 3px;
    color: #888;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .keyframe-btn:hover {
    background: #555;
    border-color: #4a9eff;
    color: #4a9eff;
  }

  .keyframe-btn.active {
    background: #4a9eff;
    border-color: #4a9eff;
    color: white;
  }

  .keyframe-btn.active:hover {
    background: #ff4a4a;
    border-color: #ff4a4a;
  }

  .clear-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    background: #444;
    border: 1px solid #666;
    border-radius: 3px;
    color: #888;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    background: #ff4a4a;
    border-color: #ff4a4a;
    color: white;
  }

  .param-input {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .param-input input[type="range"] {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #444;
    border-radius: 2px;
    outline: none;
  }

  .param-input input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #4a9eff;
    border-radius: 50%;
    cursor: pointer;
  }

  .param-input input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #4a9eff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }

  .param-input input[type="number"] {
    width: 70px;
    padding: 0.25rem 0.5rem;
    background: #333;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
    font-size: 0.85rem;
  }

  .param-input input[type="number"]:focus {
    outline: none;
    border-color: #4a9eff;
  }

  .param-value {
    color: #ccc;
    font-family: monospace;
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
