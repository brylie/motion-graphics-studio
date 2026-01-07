<script lang="ts">
  import { onMount } from "svelte";
  import { shaderLibrary, shaderLibraryActions } from "$lib/stores/shaders";
  import { timeline, timelineActions } from "$lib/stores/timeline";
  import { dragDropStore } from "$lib/stores/dragDrop";
  import type { ParsedISF } from "$lib/isf/types";

  let searchQuery = "";
  let selectedCategory = "All";

  $: categories = [
    "All",
    ...new Set(
      $shaderLibrary.shaders.flatMap((s) => s.metadata.CATEGORIES || [])
    ),
  ];

  $: filteredShaders = $shaderLibrary.shaders.filter((shader) => {
    const matchesSearch =
      searchQuery === "" ||
      shader.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shader.metadata.DESCRIPTION || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (shader.metadata.CATEGORIES || []).includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  function handleShaderClick(shader: ParsedISF) {
    // Add shader to the first track at time 0
    if ($timeline.tracks.length > 0) {
      const firstTrackId = $timeline.tracks[0].id;
      timelineActions.addClip(firstTrackId, shader.filename, 0, 5.0);
    }
  }

  function handleDragStart(e: DragEvent, shader: ParsedISF) {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = "copy";

    // Set drag state in store
    dragDropStore.startDrag("shader", { shaderId: shader.filename }, 5.0);

    // Use text/plain for better browser compatibility
    const data = JSON.stringify({
      type: "shader",
      shaderId: shader.filename,
    });
    e.dataTransfer.setData("text/plain", data);
    e.dataTransfer.setData("application/json", data);
  }

  function handleDragEnd() {
    // Clean up drag state when drag ends (whether dropped or cancelled)
    dragDropStore.endDrag();
  }

  onMount(() => {
    shaderLibraryActions.loadShaders();
  });
</script>

<div class="shader-library">
  <div class="library-header">
    <h2>Shader Library</h2>
    <input
      type="text"
      placeholder="Search shaders..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <div class="category-filter">
    {#each categories as category}
      <button
        class="category-btn"
        class:active={selectedCategory === category}
        on:click={() => (selectedCategory = category)}
      >
        {category}
      </button>
    {/each}
  </div>

  {#if $shaderLibrary.loading}
    <div class="loading">Loading shaders...</div>
  {:else if $shaderLibrary.error}
    <div class="error">{$shaderLibrary.error}</div>
  {:else}
    <div class="shader-grid">
      {#each filteredShaders as shader (shader.filename)}
        <div
          class="shader-card"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, shader)}
          on:dragend={handleDragEnd}
          on:click={() => handleShaderClick(shader)}
          role="button"
          tabindex="0"
          on:keypress={(e) => e.key === "Enter" && handleShaderClick(shader)}
        >
          <div class="shader-name">{shader.filename.replace(".fs", "")}</div>
          {#if shader.metadata.DESCRIPTION}
            <div class="shader-description">{shader.metadata.DESCRIPTION}</div>
          {/if}
          <div class="shader-info">
            {#if shader.metadata.CATEGORIES}
              <span class="categories">
                {shader.metadata.CATEGORIES.join(", ")}
              </span>
            {/if}
            {#if shader.metadata.INPUTS}
              <span class="input-count"
                >{shader.metadata.INPUTS.length} inputs</span
              >
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .shader-library {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
    color: #ccc;
    padding: 1rem;
    overflow: hidden;
  }

  .library-header {
    margin-bottom: 1rem;
  }

  .library-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #fff;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #ccc;
    font-size: 0.9rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #6a9fc7;
  }

  .category-filter {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .category-btn {
    padding: 0.4rem 0.8rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #ccc;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-btn:hover {
    background: #333;
    border-color: #555;
  }

  .category-btn.active {
    background: #4a7ba7;
    border-color: #6a9fc7;
    color: #fff;
  }

  .shader-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    flex: 1;
  }

  .shader-card {
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 1rem;
    cursor: move;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .shader-card:hover {
    background: #333;
    border-color: #6a9fc7;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .shader-name {
    font-weight: bold;
    color: #fff;
    font-size: 1rem;
  }

  .shader-description {
    font-size: 0.85rem;
    color: #aaa;
    line-height: 1.4;
  }

  .shader-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-top: auto;
    font-size: 0.75rem;
    color: #888;
  }

  .categories {
    color: #6a9fc7;
  }

  .input-count {
    color: #888;
  }

  .loading,
  .error {
    padding: 2rem;
    text-align: center;
    color: #888;
  }

  .error {
    color: #f44;
  }
</style>
