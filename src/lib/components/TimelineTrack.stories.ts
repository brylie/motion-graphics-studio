import type { Meta, StoryObj } from '@storybook/svelte';
import TimelineTrackStory from './TimelineTrackStory.svelte';

const meta = {
	title: 'Components/TimelineTrack',
	component: TimelineTrackStory,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'A complete timeline track with label, clips, and automation lanes. Supports drag-and-drop, clip selection, and automation keyframe editing.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof TimelineTrackStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		clipCount: 0,
		hasAutomation: false
	}
};

export const SingleClip: Story = {
	args: {
		clipCount: 1,
		hasAutomation: false
	}
};

export const MultipleClips: Story = {
	args: {
		clipCount: 3,
		hasAutomation: false
	}
};

export const WithAutomation: Story = {
	args: {
		clipCount: 2,
		hasAutomation: true
	}
};

export const ComplexTrack: Story = {
	args: {
		clipCount: 4,
		hasAutomation: true
	}
};
