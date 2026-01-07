import type { Meta, StoryObj } from '@storybook/svelte';
import AutomationLaneStory from './AutomationLaneStory.svelte';

const meta = {
	title: 'Components/AutomationLane',
	component: AutomationLaneStory,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'A reusable automation lane component that handles keyframe interaction for a single parameter. Each lane is isolated and handles its own coordinate space.'
			}
		}
	},
	tags: ['autodocs']
} satisfies Meta<AutomationLaneStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleParameter: Story = {
	args: {
		parameterCount: 1
	}
};

export const TwoParameters: Story = {
	args: {
		parameterCount: 2
	}
};

export const ThreeParameters: Story = {
	args: {
		parameterCount: 3
	}
};

export const ReadOnly: Story = {
	args: {
		parameterCount: 2,
		readonly: true
	}
};
