import type { Meta, StoryObj } from '@storybook/svelte';
import { get } from 'svelte/store';
import Timeline from './Timeline.svelte';
import { timeline, timelineActions } from '$lib/stores/timeline';

const meta = {
	title: 'Components/Timeline',
	component: Timeline,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

function resetTimeline() {
	timeline.set({ tracks: [], duration: 60, bpm: 120 });
}

function addClipToTrack(trackIndex: number, shaderName: string, startTime: number, duration: number) {
	const track = get(timeline).tracks[trackIndex];
	if (track) {
		timelineActions.addClip(track.id, shaderName, startTime, duration);
	}
}

// Helper to set up timeline with sample data
function setupSampleTimeline() {
	// Reset timeline
	resetTimeline();
	
	// Add tracks
	timelineActions.addTrack();
	timelineActions.addTrack();
	
	// Add clips with keyframes
	addClipToTrack(0, 'Plasma.fs', 0, 10);
	addClipToTrack(1, 'Checkerboard.fs', 5, 8);
	
	// Get clip IDs
	const clipIds = [
		get(timeline).tracks[0]?.clips[0]?.id,
		get(timeline).tracks[1]?.clips[0]?.id
	].filter((id): id is string => Boolean(id));
	
	// Add keyframes to first clip
	if (clipIds[0]) {
		timelineActions.addKeyframe(clipIds[0], 'speed', 0, 0);
		timelineActions.addKeyframe(clipIds[0], 'speed', 5, 50);
		timelineActions.addKeyframe(clipIds[0], 'speed', 10, 100);
		
		timelineActions.addKeyframe(clipIds[0], 'scale', 0, 1.0);
		timelineActions.addKeyframe(clipIds[0], 'scale', 5, 2.0);
		timelineActions.addKeyframe(clipIds[0], 'scale', 10, 1.5);
	}
	
	// Add keyframes to second clip
	if (clipIds[1]) {
		timelineActions.addKeyframe(clipIds[1], 'size', 0, 10);
		timelineActions.addKeyframe(clipIds[1], 'size', 4, 20);
		timelineActions.addKeyframe(clipIds[1], 'size', 8, 15);
	}
}

export const Empty: Story = {
	render: () => {
		// Reset to empty timeline
		resetTimeline();
		timelineActions.addTrack();
		
		return {
			Component: Timeline,
		};
	},
};

export const WithClips: Story = {
	render: () => {
		setupSampleTimeline();
		
		return {
			Component: Timeline,
		};
	},
};

export const WithAutomation: Story = {
	render: () => {
		setupSampleTimeline();
		
		return {
			Component: Timeline,
		};
	},
	parameters: {
		docs: {
			description: {
				story: 'Timeline with clips containing automation keyframes. Click keyframes to select, drag to move. Hold Alt while resizing clips for proportional keyframe scaling.',
			},
		},
	},
};

export const SingleTrack: Story = {
	render: () => {
		resetTimeline();
		timelineActions.addTrack();
		addClipToTrack(0, 'Plasma.fs', 2, 8);
		
		return {
			Component: Timeline,
		};
	},
};

export const MultipleTracks: Story = {
	render: () => {
		resetTimeline();
		timelineActions.addTrack();
		timelineActions.addTrack();
		timelineActions.addTrack();
		timelineActions.addTrack();
		
		addClipToTrack(0, 'Plasma.fs', 0, 5);
		addClipToTrack(1, 'Checkerboard.fs', 3, 6);
		addClipToTrack(2, 'Ripples.fs', 6, 4);
		addClipToTrack(3, 'Kaleidoscope.fs', 8, 7);
		
		return {
			Component: Timeline,
		};
	},
};

export const DenseKeyframes: Story = {
	render: () => {
		resetTimeline();
		timelineActions.addTrack();
		addClipToTrack(0, 'Plasma.fs', 0, 10);
		
		const clipId = get(timeline).tracks[0]?.clips[0]?.id;
		
		// Add many keyframes
		if (clipId) {
			for (let i = 0; i <= 10; i += 0.5) {
				const value = Math.sin(i) * 50 + 50;
				timelineActions.addKeyframe(clipId, 'speed', i, value);
			}
		}
		
		return {
			Component: Timeline,
		};
	},
	parameters: {
		docs: {
			description: {
				story: 'Timeline with dense keyframe data showing smooth animation curves.',
			},
		},
	},
};
