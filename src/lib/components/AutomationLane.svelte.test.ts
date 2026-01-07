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
		it('should render SVG with correct dimensions', () => {
			const { container } = render(AutomationLane, { props: defaultProps });
			const svg = container.querySelector('svg');
			
			expect(svg).toBeTruthy();
			// Width is now dynamic: clipDuration (10s) * pixelsPerSecond (50) = 500px
			expect(svg?.getAttribute('width')).toBe('500');
			// Height = laneHeight (40) - 14 (label space) = 26px
			expect(svg?.getAttribute('height')).toBe('26');
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
			
			// Verify SVG circles are rendered for keyframes
			// Each keyframe has 2 circles: hit area + visible keyframe
			const circles = container.querySelectorAll('circle');
			expect(circles.length).toBe(keyframes.length * 2);
			
			// Check that the visible keyframes have the correct class
			const visibleKeyframes = container.querySelectorAll('.keyframe');
			expect(visibleKeyframes.length).toBe(keyframes.length);
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
		expect(container1.querySelector('svg')).toBeTruthy();
		expect(container2.querySelector('svg')).toBeTruthy();
		expect(container1.textContent).toContain('param1');
		expect(container2.textContent).toContain('param2');
	});
});

describe('edge cases', () => {
	it('should handle empty keyframes array', () => {
		const { container } = render(AutomationLane, { 
			props: { ...defaultProps, keyframes: [] }
		});
		
		expect(container.querySelector('svg')).toBeTruthy();
	});

	it('should handle single keyframe', () => {
		const keyframes: Keyframe[] = [{ time: 5, value: 0.5 }];
		const { container } = render(AutomationLane, { 
			props: { ...defaultProps, keyframes }
		});
		
		expect(container.querySelector('svg')).toBeTruthy();
	});
});

describe('keyframe positioning', () => {
	it('positions keyframes correctly based on time and pixelsPerSecond', () => {
		const pixelsPerSecond = 100;
		const keyframes: Keyframe[] = [
			{ time: 0, value: 0 },
			{ time: 2.5, value: 0.5 },
			{ time: 5, value: 1 },
		];
		
		const { container } = render(AutomationLane, {
			props: { ...defaultProps, keyframes, pixelsPerSecond }
		});
		
		const visibleKeyframes = container.querySelectorAll('.keyframe');
		
		// First keyframe at time 0: 0 * 100 = 0px
		expect((visibleKeyframes[0] as SVGCircleElement).getAttribute('cx')).toBe('0');
		
		// Second keyframe at time 2.5: 2.5 * 100 = 250px
		expect((visibleKeyframes[1] as SVGCircleElement).getAttribute('cx')).toBe('250');
		
		// Third keyframe at time 5: 5 * 100 = 500px
		expect((visibleKeyframes[2] as SVGCircleElement).getAttribute('cx')).toBe('500');
	});

	it('positions keyframes within clip duration bounds', () => {
		const clipDuration = 10;
		const pixelsPerSecond = 50;
		const keyframes: Keyframe[] = [
			{ time: 0, value: 0 },
			{ time: 10, value: 1 },
		];
		
		const { container } = render(AutomationLane, {
			props: { ...defaultProps, clipDuration, keyframes, pixelsPerSecond }
		});
		
		const visibleKeyframes = container.querySelectorAll('.keyframe');
		
		const firstX = parseFloat((visibleKeyframes[0] as SVGCircleElement).getAttribute('cx') || '0');
		const lastX = parseFloat((visibleKeyframes[1] as SVGCircleElement).getAttribute('cx') || '0');
		
		expect(firstX).toBe(0);
		expect(lastX).toBe(clipDuration * pixelsPerSecond);
	});

	it('inverts Y values correctly (value 0 at bottom, 1 at top)', () => {
		const keyframes: Keyframe[] = [
			{ time: 0, value: 0 },   // Bottom
			{ time: 1, value: 1 },   // Top
			{ time: 2, value: 0.5 }, // Middle
		];
		
		const { container } = render(AutomationLane, {
			props: { ...defaultProps, keyframes, laneHeight: 50 }
		});
		
		const visibleKeyframes = container.querySelectorAll('.keyframe');
		
		const cy0 = parseFloat((visibleKeyframes[0] as SVGCircleElement).getAttribute('cy') || '0');
		const cy1 = parseFloat((visibleKeyframes[1] as SVGCircleElement).getAttribute('cy') || '0');
		const cy2 = parseFloat((visibleKeyframes[2] as SVGCircleElement).getAttribute('cy') || '0');
		
		// Value 0 should have higher Y (near bottom)
		// Value 1 should have lower Y (near top)
		expect(cy0).toBeGreaterThan(cy1);
		expect(cy2).toBeGreaterThan(cy1);
		expect(cy2).toBeLessThan(cy0);
	});
});
});
