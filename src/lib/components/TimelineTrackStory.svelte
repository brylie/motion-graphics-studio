<script lang="ts">
  import TimelineTrack from "./TimelineTrack.svelte";
  import type { Track } from "$lib/timeline/types";

  export let clipCount: number = 1;
  export let hasAutomation: boolean = false;

  const pixelsPerSecond = 50;

  // Create a mock track with clips
  $: track = {
    id: "track-1",
    name: "Video Track 1",
    clips: Array.from({ length: clipCount }, (_, i) => ({
      id: `clip-${i}`,
      shaderId: i % 2 === 0 ? "Plasma.fs" : "Checkerboard.fs",
      shaderName: i % 2 === 0 ? "Plasma" : "Checkerboard",
      startTime: i * 8,
      duration: 5,
      parameters: {},
      automation: hasAutomation
        ? [
            {
              parameterName: "speed",
              keyframes: [
                { time: 0, value: 0.5 },
                { time: 2.5, value: 1.0 },
                { time: 5, value: 0.3 },
              ],
            },
          ]
        : [],
      alpha: 1.0,
    })),
    muted: false,
    solo: false,
    height: 60,
  } as Track;

  function handleClipSelect(e: CustomEvent) {
    console.log("Clip selected:", e.detail);
  }

  function handleClipResizeStart(e: CustomEvent) {
    console.log("Resize started:", e.detail);
  }

  function handleKeyframeSelect(e: CustomEvent) {
    console.log("Keyframe selected:", e.detail);
  }

  function handleKeyframeMove(e: CustomEvent) {
    console.log("Keyframe moved:", e.detail);
  }
</script>

<div style="width: 100%; height: 100%; background: #111827;">
  <TimelineTrack
    {track}
    {pixelsPerSecond}
    selectedClipId={null}
    selectedKeyframe={null}
    on:clipselect={handleClipSelect}
    on:clipresizestart={handleClipResizeStart}
    on:keyframeselect={handleKeyframeSelect}
    on:keyframemove={handleKeyframeMove}
  />
</div>
