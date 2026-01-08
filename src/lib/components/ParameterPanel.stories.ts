import type { Meta, StoryObj } from '@storybook/svelte';
import ParameterPanelStory from './ParameterPanelStory.svelte';

const meta = {
	title: 'Components/ParameterPanel',
	component: ParameterPanelStory,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'A panel for editing shader parameters of the selected clip. Displays parameter controls, allows setting keyframes, and shows current parameter values at the playhead position.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<ParameterPanelStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {
	args: {
		selectedClipId: null,
		hasClip: false
	},
	parameters: {
		docs: {
			description: {
				story: 'When no clip is selected, the panel displays a message prompting the user to select a clip.'
			}
		}
	}
};

export const WithClipSelected: Story = {
	args: {
		selectedClipId: 'clip-1',
		hasClip: true
	},
	parameters: {
		docs: {
			description: {
				story: 'When a clip is selected on the timeline, the panel shows all available parameters with controls for the shader.'
			}
		}
	}
};
