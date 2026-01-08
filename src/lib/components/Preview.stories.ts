import type { Meta, StoryObj } from '@storybook/svelte';
import PreviewStory from './PreviewStory.svelte';

const meta = {
	title: 'Components/Preview',
	component: PreviewStory,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'WebGL-based preview canvas that renders the composition in real-time. Composites multiple shader effects based on timeline configuration.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<typeof PreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		hasClips: false
	},
	parameters: {
		docs: {
			description: {
				story: 'Preview canvas with an empty timeline showing black screen.'
			}
		}
	}
};

export const WithClip: Story = {
	args: {
		hasClips: true
	},
	parameters: {
		docs: {
			description: {
				story: 'Preview canvas rendering a shader clip from the timeline.'
			}
		}
	}
};
