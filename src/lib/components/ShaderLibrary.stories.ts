import type { Meta, StoryObj } from '@storybook/svelte';
import ShaderLibraryStory from './ShaderLibraryStory.svelte';

const meta = {
	title: 'Components/ShaderLibrary',
	component: ShaderLibraryStory,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'A panel displaying available ISF shaders with search and category filtering. Shaders can be dragged onto the timeline or clicked to add them.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof ShaderLibraryStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FewShaders: Story = {
	args: {
		shaderCount: 3
	},
	parameters: {
		docs: {
			description: {
				story: 'Library with a small collection of shaders.'
			}
		}
	}
};

export const WithShaders: Story = {
	args: {
		shaderCount: 8
	},
	parameters: {
		docs: {
			description: {
				story: 'Library populated with multiple available shaders for drag-and-drop.'
			}
		}
	}
};
