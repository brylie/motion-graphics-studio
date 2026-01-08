<script lang="ts">
  import TimelineClip from "./TimelineClip.svelte";
  import type { Clip } from "$lib/timeline/types";

  export let startTime: number = 2;
  export let duration: number = 5;
  export let pixelsPerSecond: number = 50;
  export let isSelected: boolean = false;

  // Create a mock clip
  $: clip = {
    id: "clip-1",
    shaderId: "Plasma.fs",
    shaderName: "Plasma",
    startTime,
    duration,
    parameters: {},
    automation: [],
    alpha: 1.0,
  } as Clip;

  function handleSelect(e: CustomEvent) {
    console.log("Clip selected:", e.detail);
  }

  function handleResizeStart(e: CustomEvent) {
    console.log("Resize started:", e.detail);
  }
</script>

<div
  style="position: relative; width: 100%; height: 60px; background: #111827; border: 1px solid #374151;"
>
  <TimelineClip
    {clip}
    {pixelsPerSecond}
    {isSelected}
    on:select={handleSelect}
    on:resizestart={handleResizeStart}
  />
</div>

<style>
  div {
    margin: 20px 0;
  }
</style>
