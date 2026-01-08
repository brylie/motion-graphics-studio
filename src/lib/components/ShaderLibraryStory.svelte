<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ShaderLibrary from "./ShaderLibrary.svelte";
  import type { ParsedISF } from "$lib/isf/types";
  import type { Timeline } from "$lib/timeline/types";

  export let shaderCount: number = 8;

  // Create mock shaders
  const mockShaders: ParsedISF[] = Array.from(
    { length: shaderCount },
    (_, i) => ({
      filename: `Shader${i + 1}.fs`,
      fragmentShader: `// Shader ${i + 1} source`,
      metadata: {
        ISFVSN: "2.0",
        DESCRIPTION: `Sample shader ${i + 1} with various effects`,
        CREDIT: "Sample Author",
        CATEGORIES:
          i % 3 === 0
            ? ["Generator"]
            : i % 3 === 1
              ? ["Effect"]
              : ["Distortion"],
        INPUTS: [
          {
            NAME: "speed",
            TYPE: "float",
            DEFAULT: 1.0,
            MIN: 0.0,
            MAX: 10.0,
          },
        ],
      },
    })
  );

  // Create mock stores
  const mockShaderLibrary = writable({
    shaders: mockShaders,
    loading: false,
    error: null,
  });

  const mockTimeline = writable<Timeline>({
    tracks: [
      {
        id: "track-1",
        name: "Track 1",
        clips: [],
        muted: false,
        solo: false,
        height: 60,
      },
    ],
    duration: 60,
    bpm: 120,
  });

  const mockDragDropStore = writable({
    isDragging: false,
    dragType: null,
    sourceData: {},
    duration: 5.0,
    previewPosition: {
      trackId: null,
      time: 0,
      visible: false,
    },
  });

  // Mock actions
  const mockShaderLibraryActions = {
    loadShaders: async () => {
      console.log("Mock loadShaders");
    },
  };

  const mockTimelineActions = {
    addClip: (
      trackId: string,
      shaderId: string,
      startTime: number,
      duration: number
    ) => {
      console.log("Mock addClip:", { trackId, shaderId, startTime, duration });
    },
  };

  const mockDragDropActions = {
    startDrag: (type: string, data: any, duration: number) => {
      console.log("Mock startDrag:", { type, data, duration });
    },
    endDrag: () => {
      console.log("Mock endDrag");
    },
  };

  // Set contexts
  setContext("shaderLibrary", mockShaderLibrary);
  setContext("timeline", mockTimeline);
  setContext("dragDropStore", mockDragDropStore);
  setContext("shaderLibraryActions", mockShaderLibraryActions);
  setContext("timelineActions", mockTimelineActions);
  setContext("dragDropStore", mockDragDropStore);
</script>

<div style="width: 100%; max-width: 400px; height: 600px; background: #1f2937;">
  <ShaderLibrary />
</div>
