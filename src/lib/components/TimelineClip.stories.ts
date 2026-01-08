import type { Meta, StoryObj } from '@storybook/svelte';
import TimelineClipStory from './TimelineClipStory.svelte';

const meta = {
	title: 'Components/TimelineClip',
	component: TimelineClipStory,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'A visual representation of a clip on the timeline. Supports selection, dragging, and resizing with handles. Shows clip name and duration.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		startTime: {
			control: { type: 'number', min: 0, max: 50, step: 0.5 },
			description: 'Start time of the clip in seconds'
		},
		duration: {
			control: { type: 'number', min: 0.5, max: 20, step: 0.5 },
			description: 'Duration of the clip in seconds'
		},
		pixelsPerSecond: {
			control: { type: 'number', min: 20, max: 100, step: 10 },
			description: 'Zoom level - pixels per second'
		},
		isSelected: {
			control: 'boolean',
			description: 'Whether the clip is currently selected'
		}
	}
} satisfies Meta<TimelineClipStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		startTime: 2,
		duration: 5,
		pixelsPerSecond: 50,
		isSelected: false
	}
};

export const Selected: Story = {
	args: {
		startTime: 2,
		duration: 5,
		pixelsPerSecond: 50,
		isSelected: true
	}
};

export const ShortClip: Story = {
	args: {
		startTime: 0,
		duration: 1,
		pixelsPerSecond: 50,
		isSelected: false
	}
};

export const LongClip: Story = {
	args: {
		startTime: 5,
		duration: 15,
		pixelsPerSecond: 50,
		isSelected: false
	}
};

export const ZoomedIn: Story = {
	args: {
		startTime: 2,
		duration: 5,
		pixelsPerSecond: 100,
		isSelected: false
	}
};
