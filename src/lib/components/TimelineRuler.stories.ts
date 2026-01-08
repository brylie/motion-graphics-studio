import type { Meta, StoryObj } from '@storybook/svelte';
import TimelineRuler from './TimelineRuler.svelte';

const meta = {
	title: 'Components/TimelineRuler',
	component: TimelineRuler,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'A timeline ruler that displays time markers and allows scrubbing through the timeline. The ruler adjusts marker density based on zoom level.'
			}
		}
	},
	tags: ['autodocs'],
	argTypes: {
		duration: {
			control: { type: 'number', min: 10, max: 300, step: 10 },
			description: 'Total duration of the timeline in seconds'
		},
		pixelsPerSecond: {
			control: { type: 'number', min: 10, max: 200, step: 10 },
			description: 'Zoom level - pixels per second'
		}
	}
} satisfies Meta<TimelineRuler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		duration: 60,
		pixelsPerSecond: 50
	}
};

export const ZoomedIn: Story = {
	args: {
		duration: 60,
		pixelsPerSecond: 100
	}
};

export const ZoomedOut: Story = {
	args: {
		duration: 60,
		pixelsPerSecond: 25
	}
};

export const ShortDuration: Story = {
	args: {
		duration: 10,
		pixelsPerSecond: 50
	}
};

export const LongDuration: Story = {
	args: {
		duration: 180,
		pixelsPerSecond: 30
	}
};
