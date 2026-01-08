import type { Meta, StoryObj } from '@storybook/svelte';
import Preview from './Preview.svelte';

const meta = {
	title: 'Components/Preview',
	component: Preview,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'WebGL-based preview canvas that renders the composition in real-time. Composites multiple shader effects based on timeline configuration.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<Preview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Rendering: Story = {
	parameters: {
		docs: {
			description: {
				story: 'The preview component automatically initializes WebGL and begins rendering the timeline composition.'
			}
		}
	}
};
