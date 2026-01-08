import type { Meta, StoryObj } from '@storybook/svelte';
import PlaybackControlsStory from './PlaybackControlsStory.svelte';

const meta = {
	title: 'Components/PlaybackControls',
	component: PlaybackControlsStory,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'Transport controls for timeline playback including play/pause, stop, loop toggle, and zoom controls. Displays current playback time.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof PlaybackControlsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stopped: Story = {
	args: {
		isPlaying: false,
		currentTime: 0,
		loop: false,
		pixelsPerSecond: 50
	},
	parameters: {
		docs: {
			description: {
				story: 'Controls in stopped state at the beginning of the timeline.'
			}
		}
	}
};

export const Playing: Story = {
	args: {
		isPlaying: true,
		currentTime: 5.5,
		loop: false,
		pixelsPerSecond: 50
	},
	parameters: {
		docs: {
			description: {
				story: 'Controls when playback is active - play button shows pause icon.'
			}
		}
	}
};

export const WithLoop: Story = {
	args: {
		isPlaying: false,
		currentTime: 2.3,
		loop: true,
		pixelsPerSecond: 50
	},
	parameters: {
		docs: {
			description: {
				story: 'Controls with loop enabled - loop button is highlighted.'
			}
		}
	}
};
