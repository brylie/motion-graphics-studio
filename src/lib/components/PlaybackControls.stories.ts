import type { Meta, StoryObj } from '@storybook/svelte';
import PlaybackControls from './PlaybackControls.svelte';

const meta = {
	title: 'Components/PlaybackControls',
	component: PlaybackControls,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'Transport controls for timeline playback including play/pause, stop, loop toggle, and zoom controls. Displays current playback time.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<PlaybackControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Playing: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Interact with the play button to toggle playback state.'
			}
		}
	}
};

export const WithLoop: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Toggle the loop button to enable continuous playback.'
			}
		}
	}
};
