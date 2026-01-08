<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import Preview from "./Preview.svelte";
  import type { Timeline, PlaybackState } from "$lib/timeline/types";
  import type { ParsedISF } from "$lib/isf/types";

  export let hasClips: boolean = true;

  // Create sample shader
  const plasmaShader: ParsedISF = {
    filename: "Plasma.fs",
    fragmentShader: `
      void main() {
        vec2 p = gl_FragCoord.xy / iResolution.xy;
        float t = iTime * 0.5;
        vec3 col = 0.5 + 0.5 * cos(t + p.xyx + vec3(0, 2, 4));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    metadata: {
      ISFVSN: "2.0",
      DESCRIPTION: "A colorful plasma effect",
      CREDIT: "Sample",
      CATEGORIES: ["Generator"],
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
  };

  // Create mock timeline
  const mockTimeline = writable<Timeline>({
    tracks: hasClips
      ? [
          {
            id: "track-1",
            name: "Track 1",
            clips: [
              {
                id: "clip-1",
                shaderId: "Plasma.fs",
                shaderName: "Plasma",
                startTime: 0,
                duration: 10,
                parameters: {
                  speed: 1.5,
                },
                automation: [],
                alpha: 1.0,
              },
            ],
            muted: false,
            solo: false,
            height: 60,
          },
        ]
      : [],
    duration: 60,
    bpm: 120,
  });

  // Create mock playback
  const mockPlayback = writable<PlaybackState>({
    isPlaying: false,
    currentTime: 2.5,
    loop: false,
    loopStart: 0,
    loopEnd: 60,
  });

  // Create mock shader library
  const mockShaderLibrary = writable({
    shaders: [plasmaShader],
    loading: false,
    error: null,
  });

  // Mock playback actions
  const mockPlaybackActions = {
    togglePlay: () => {
      mockPlayback.update((pb) => ({ ...pb, isPlaying: !pb.isPlaying }));
    },
    stop: () => {
      mockPlayback.update((pb) => ({
        ...pb,
        isPlaying: false,
        currentTime: 0,
      }));
    },
    updateTime: (delta: number) => {
      mockPlayback.update((pb) => ({
        ...pb,
        currentTime: pb.currentTime + delta,
      }));
    },
  };

  // Set contexts
  setContext("timeline", mockTimeline);
  setContext("playback", mockPlayback);
  setContext("shaderLibrary", mockShaderLibrary);
  setContext("playbackActions", mockPlaybackActions);
</script>

<div style="width: 100%; height: 600px; background: #000;">
  <Preview />
</div>
