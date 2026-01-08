import type { Meta, StoryObj } from '@storybook/svelte';
import ParameterPanel from './ParameterPanel.svelte';

const meta = {
	title: 'Components/ParameterPanel',
	component: ParameterPanel,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'A panel for editing shader parameters of the selected clip. Displays parameter controls, allows setting keyframes, and shows current parameter values at the playhead position.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<ParameterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoSelection: Story = {
	parameters: {
		docs: {
			description: {
				story: 'When no clip is selected, the panel displays a message prompting the user to select a clip.'
			}
		}
	}
};

export const WithClipSelected: Story = {
	parameters: {
		docs: {
			description: {
				story: 'When a clip is selected on the timeline, the panel shows all available parameters with controls for the shader.'
			}
		}
	}
};
