<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ParameterPanel from "./ParameterPanel.svelte";
  import type { Timeline, TimelineViewState } from "$lib/timeline/types";
  import type { PlaybackState } from "$lib/timeline/types";

  export let selectedClipId: string | null = null;
  export let hasClip: boolean = false;

  // Create mock stores
  const mockTimeline = writable<Timeline>({
    tracks: hasClip
      ? [
          {
            id: "track-1",
            name: "Track 1",
            clips: [
              {
                id: "clip-1",
                shaderId: "Plasma.fs",
                shaderName: "Plasma",
                startTime: 2,
                duration: 5,
                parameters: {
                  speed: 1.5,
                  scale: 2.0,
                  brightness: 0.8,
                },
                automation: [
                  {
                    parameterName: "speed",
                    keyframes: [
                      { time: 0, value: 1.0 },
                      { time: 2.5, value: 2.0 },
                    ],
                  },
                ],
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

  const mockTimelineView = writable<TimelineViewState>({
    pixelsPerSecond: 50,
    selectedClipId: hasClip ? selectedClipId || "clip-1" : null,
    selectedTrackId: null,
    selectedKeyframe: null,
  });

  const mockPlayback = writable<PlaybackState>({
    isPlaying: false,
    currentTime: 3.5,
    loop: false,
    loopStart: 0,
    loopEnd: 60,
  });

  // Set contexts that the component expects
  setContext("timeline", mockTimeline);
  setContext("timelineView", mockTimelineView);
  setContext("playback", mockPlayback);

  // Mock actions
  const mockTimelineActions = {
    addKeyframe: (
      clipId: string,
      param: string,
      time: number,
      value: number
    ) => {
      console.log("Mock addKeyframe:", { clipId, param, time, value });
    },
    removeKeyframe: (clipId: string, param: string, time: number) => {
      console.log("Mock removeKeyframe:", { clipId, param, time });
    },
    updateParameter: (clipId: string, param: string, value: any) => {
      console.log("Mock updateParameter:", { clipId, param, value });
    },
  };

  setContext("timelineActions", mockTimelineActions);
</script>

<div style="width: 100%; height: 600px; background: #1f2937; padding: 16px;">
  <ParameterPanel />
</div>
