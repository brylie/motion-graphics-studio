<script lang="ts">
  import { setContext } from "svelte";
  import { writable, derived } from "svelte/store";
  import PlaybackControls from "./PlaybackControls.svelte";
  import { formatTime } from "$lib/stores/playback";
  import type { PlaybackState, TimelineViewState } from "$lib/timeline/types";
  import {
    PLAYBACK_CONTEXT,
    FORMATTED_TIME_CONTEXT,
    TIMELINE_VIEW_CONTEXT,
    PLAYBACK_ACTIONS_CONTEXT,
    VIEW_ACTIONS_CONTEXT,
  } from "$lib/constants/contexts";

  export let isPlaying: boolean = false;
  export let currentTime: number = 5.5;
  export let loop: boolean = false;
  export let pixelsPerSecond: number = 50;

  // Create mock playback store
  const mockPlayback = writable<PlaybackState>({
    isPlaying,
    currentTime,
    loop,
    loopStart: 0,
    loopEnd: 60,
  });

  // Update when props change
  $: mockPlayback.set({
    isPlaying,
    currentTime,
    loop,
    loopStart: 0,
    loopEnd: 60,
  });

  // Create formatted time derived store using the shared formatter
  const mockFormattedTime = derived(mockPlayback, ($pb) =>
    formatTime($pb.currentTime)
  );

  // Create mock timeline view store
  const mockTimelineView = writable<TimelineViewState>({
    pixelsPerSecond,
    selectedClipId: null,
    selectedTrackId: null,
    selectedKeyframe: null,
  });

  // Mock actions
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
    toggleLoop: () => {
      mockPlayback.update((pb) => ({ ...pb, loop: !pb.loop }));
    },
    seek: (time: number) => {
      mockPlayback.update((pb) => ({ ...pb, currentTime: time }));
    },
    updateTime: (delta: number) => {
      mockPlayback.update((pb) => ({
        ...pb,
        currentTime: pb.currentTime + delta,
      }));
    },
  };

  const mockViewActions = {
    setZoom: (zoom: number) => {
      mockTimelineView.update((tv) => ({ ...tv, pixelsPerSecond: zoom }));
    },
    setScroll: (scroll: number) => {
      console.log("Mock setScroll:", scroll);
    },
  };

  // Set contexts
  setContext(PLAYBACK_CONTEXT, mockPlayback);
  setContext(FORMATTED_TIME_CONTEXT, mockFormattedTime);
  setContext(TIMELINE_VIEW_CONTEXT, mockTimelineView);
  setContext(PLAYBACK_ACTIONS_CONTEXT, mockPlaybackActions);
  setContext(VIEW_ACTIONS_CONTEXT, mockViewActions);
</script>

<div style="background: #111827; padding: 16px;">
  <PlaybackControls />
</div>
