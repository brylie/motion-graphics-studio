import type { Meta, StoryObj } from '@storybook/svelte';
import KeyframeDemo from './KeyframeDemo.svelte';

const meta = {
	title: 'Components/Keyframe Utilities',
	component: KeyframeDemo,
	parameters: {
		layout: 'fullscreen'
	},
	tags: ['autodocs']
} satisfies Meta<typeof KeyframeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {}
};
