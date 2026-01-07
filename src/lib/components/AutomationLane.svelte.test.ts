import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import AutomationLane from './AutomationLane.svelte';
import type { Keyframe } from '$lib/timeline/types';

describe('AutomationLane', () => {
	const defaultProps = {
		parameterName: 'testParam',
		keyframes: [] as Keyframe[],
		clipDuration: 10,
		pixelsPerSecond: 50,
		laneHeight: 40,
		keyframeSize: 8,
		selectedKeyframeTime: null,
		readonly: false
	};

	describe('rendering', () => {
		it('should render canvas with correct dimensions', () => {
			const { container } = render(AutomationLane, { props: defaultProps });
			const canvas = container.querySelector('canvas');
			
			expect(canvas).toBeTruthy();
			// Width is now dynamic: clipDuration (10s) * pixelsPerSecond (50) = 500px
			expect(canvas?.width).toBe(500);
			expect(canvas?.height).toBe(40);
		});

		it('should display parameter name', () => {
			const { container } = render(AutomationLane, { 
				props: { ...defaultProps, parameterName: 'brightness' }
			});
			
			expect(container.textContent).toContain('brightness');
		});

		it('should render keyframes', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.5 },
				{ time: 5, value: 0.8 }
			];
			
			const { container } = render(AutomationLane, { 
				props: { ...defaultProps, keyframes }
			});
			
			// Just verify it renders without error
			expect(container.querySelector('canvas')).toBeTruthy();
		});
	});

	describe('multiple automation lanes', () => {
		it('should handle two lanes independently', () => {
			const keyframes1: Keyframe[] = [{ time: 2, value: 0.3 }];
			const keyframes2: Keyframe[] = [{ time: 5, value: 0.7 }];
			
			const { container: container1 } = render(AutomationLane, { 
				props: { 
					...defaultProps, 
					parameterName: 'param1',
					keyframes: keyframes1
				}
			});
			
			const { container: container2 } = render(AutomationLane, { 
				props: { 
					...defaultProps, 
					parameterName: 'param2',
					keyframes: keyframes2
				}
			});
			
			// Both should render independently
			expect(container1.querySelector('canvas')).toBeTruthy();
			expect(container2.querySelector('canvas')).toBeTruthy();
			expect(container1.textContent).toContain('param1');
			expect(container2.textContent).toContain('param2');
		});
	});

	describe('edge cases', () => {
		it('should handle empty keyframes array', () => {
			const { container } = render(AutomationLane, { 
				props: { ...defaultProps, keyframes: [] }
			});
			
			expect(container.querySelector('canvas')).toBeTruthy();
		});

		it('should handle single keyframe', () => {
			const keyframes: Keyframe[] = [{ time: 5, value: 0.5 }];
			const { container } = render(AutomationLane, { 
				props: { ...defaultProps, keyframes }
			});
			
			expect(container.querySelector('canvas')).toBeTruthy();
		});
	});
});
