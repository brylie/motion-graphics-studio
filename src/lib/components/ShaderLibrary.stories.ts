import type { Meta, StoryObj } from '@storybook/svelte';
import ShaderLibrary from './ShaderLibrary.svelte';

const meta = {
	title: 'Components/ShaderLibrary',
	component: ShaderLibrary,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'A panel displaying available ISF shaders with search and category filtering. Shaders can be dragged onto the timeline or clicked to add them.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<ShaderLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearch: Story = {
	play: async ({ canvasElement }) => {
		// This story could demonstrate the search functionality
		// but requires interaction testing setup
	}
};
