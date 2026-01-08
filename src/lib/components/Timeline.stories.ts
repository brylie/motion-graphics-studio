import type { Meta, StoryObj } from '@storybook/svelte';
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

// Helper to set up timeline with sample data
function setupSampleTimeline() {
	// Reset timeline
	timeline.set({ tracks: [], duration: 60 });
	
	// Add tracks
	timelineActions.addTrack();
	timelineActions.addTrack();
	
	// Add clips with keyframes
	timelineActions.addClip(0, 'plasma', 'Plasma', 0, 10);
	timelineActions.addClip(1, 'checkerboard', 'Checkerboard', 5, 8);
	
	// Get clip IDs
	const state = timeline;
	let clipIds: string[] = [];
	state.subscribe($state => {
		if ($state.tracks.length > 0) {
			clipIds = [
				$state.tracks[0].clips[0]?.id,
				$state.tracks[1].clips[0]?.id
			].filter(Boolean);
		}
	})();
	
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
		timeline.set({ tracks: [], duration: 60 });
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
		timeline.set({ tracks: [], duration: 60 });
		timelineActions.addTrack();
		timelineActions.addClip(0, 'plasma', 'Plasma', 2, 8);
		
		return {
			Component: Timeline,
		};
	},
};

export const MultipleTracks: Story = {
	render: () => {
		timeline.set({ tracks: [], duration: 60 });
		timelineActions.addTrack();
		timelineActions.addTrack();
		timelineActions.addTrack();
		timelineActions.addTrack();
		
		timelineActions.addClip(0, 'plasma', 'Plasma', 0, 5);
		timelineActions.addClip(1, 'checkerboard', 'Checkerboard', 3, 6);
		timelineActions.addClip(2, 'ripples', 'Ripples', 6, 4);
		timelineActions.addClip(3, 'kaleidoscope', 'Kaleidoscope', 8, 7);
		
		return {
			Component: Timeline,
		};
	},
};

export const DenseKeyframes: Story = {
	render: () => {
		timeline.set({ tracks: [], duration: 60 });
		timelineActions.addTrack();
		timelineActions.addClip(0, 'plasma', 'Plasma', 0, 10);
		
		const state = timeline;
		let clipId: string = '';
		state.subscribe($state => {
			if ($state.tracks[0]?.clips[0]) {
				clipId = $state.tracks[0].clips[0].id;
			}
		})();
		
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
