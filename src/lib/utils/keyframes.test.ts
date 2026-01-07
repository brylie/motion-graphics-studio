import { describe, it, expect } from 'vitest';
import {
	clampTimeToAdjacentKeyframes,
	clampValue,
	moveKeyframe,
	sortKeyframes,
	validateKeyframes,
	findKeyframeIndex,
	type Keyframe,
	type KeyframeConstraints
} from './keyframes';

describe('keyframes utilities', () => {
	describe('clampTimeToAdjacentKeyframes', () => {
		it('should clamp time between neighbors', () => {
			const keyframes: Keyframe[] = [
				{ time: 0, value: 0 },
				{ time: 2, value: 0.5 },
				{ time: 4, value: 1 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			// Try to move middle keyframe too far left
			const clampedLeft = clampTimeToAdjacentKeyframes(0.5, keyframes, 1, constraints);
			expect(clampedLeft).toBeGreaterThan(0); // Should be after first keyframe
			expect(clampedLeft).toBeLessThan(2); // Should be before original position
			
			// Try to move middle keyframe too far right
			const clampedRight = clampTimeToAdjacentKeyframes(3.99, keyframes, 1, constraints);
			expect(clampedRight).toBeGreaterThan(2); // Should be after original position
			expect(clampedRight).toBeLessThan(4); // Should be before last keyframe
		});
		
		it('should respect clip boundaries for first keyframe', () => {
			const keyframes: Keyframe[] = [
				{ time: 1, value: 0 },
				{ time: 3, value: 0.5 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			// Try to move first keyframe before clip start
			const clamped = clampTimeToAdjacentKeyframes(-1, keyframes, 0, constraints);
			expect(clamped).toBe(0); // Should be clamped to minTime
		});
		
		it('should respect clip boundaries for last keyframe', () => {
			const keyframes: Keyframe[] = [
				{ time: 1, value: 0 },
				{ time: 3, value: 0.5 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 5 };
			
			// Try to move last keyframe beyond clip end
			const clamped = clampTimeToAdjacentKeyframes(6, keyframes, 1, constraints);
			expect(clamped).toBe(5); // Should be clamped to maxTime
		});
		
		it('should apply snap grid', () => {
			const keyframes: Keyframe[] = [{ time: 0, value: 0 }];
			const constraints: KeyframeConstraints = { 
				minTime: 0, 
				maxTime: 10,
				snapGrid: 0.5 
			};
			
			const snapped = clampTimeToAdjacentKeyframes(1.23, keyframes, 0, constraints);
			expect(snapped).toBe(1.0); // Should snap to nearest 0.5
		});
		
		it('should maintain minimum gap between keyframes', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.5 },
				{ time: 2.1, value: 0.6 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			// Try to move second keyframe to exactly same position as first
			const clamped = clampTimeToAdjacentKeyframes(2, keyframes, 1, constraints);
			expect(clamped).toBeGreaterThan(2); // Should maintain gap
			expect(clamped - 2).toBeGreaterThanOrEqual(0.02); // Minimum 0.02 gap
		});
	});
	
	describe('clampValue', () => {
		it('should clamp values to 0-1 range by default', () => {
			expect(clampValue(-0.5)).toBe(0);
			expect(clampValue(0.5)).toBe(0.5);
			expect(clampValue(1.5)).toBe(1);
		});
		
		it('should respect custom min/max', () => {
			expect(clampValue(5, 0, 10)).toBe(5);
			expect(clampValue(-5, 0, 10)).toBe(0);
			expect(clampValue(15, 0, 10)).toBe(10);
		});
	});
	
	describe('moveKeyframe', () => {
		it('should return clamped position when moving between neighbors', () => {
			const keyframes: Keyframe[] = [
				{ time: 0, value: 0 },
				{ time: 2, value: 0.5 },
				{ time: 4, value: 1 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			// Try to move middle keyframe past right neighbor
			const result = moveKeyframe(keyframes, 2, 5, 0.8, constraints);
			expect(result.time).toBeLessThan(4); // Should be clamped before right neighbor
			expect(result.time).toBeGreaterThan(2); // Should have moved right
			expect(result.value).toBe(0.8); // Value should be applied
		});
		
		it('should prevent overlapping when dragging left', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.3 },
				{ time: 5, value: 0.7 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			// Try to drag right keyframe past left keyframe
			const result = moveKeyframe(keyframes, 5, 1, 0.5, constraints);
			expect(result.time).toBeGreaterThan(2); // Should stay right of left keyframe
		});
		
		it('should prevent overlapping when dragging right', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.3 },
				{ time: 5, value: 0.7 }
			];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			// Try to drag left keyframe past right keyframe
			const result = moveKeyframe(keyframes, 2, 6, 0.5, constraints);
			expect(result.time).toBeLessThan(5); // Should stay left of right keyframe
		});
		
		it('should throw error if keyframe not found', () => {
			const keyframes: Keyframe[] = [{ time: 2, value: 0.5 }];
			const constraints: KeyframeConstraints = { minTime: 0, maxTime: 10 };
			
			expect(() => {
				moveKeyframe(keyframes, 999, 3, 0.5, constraints);
			}).toThrow('Keyframe at time 999 not found');
		});
	});
	
	describe('sortKeyframes', () => {
		it('should sort keyframes by time', () => {
			const keyframes: Keyframe[] = [
				{ time: 5, value: 0.5 },
				{ time: 2, value: 0.2 },
				{ time: 8, value: 0.8 }
			];
			
			const sorted = sortKeyframes(keyframes);
			expect(sorted[0].time).toBe(2);
			expect(sorted[1].time).toBe(5);
			expect(sorted[2].time).toBe(8);
		});
		
		it('should not mutate original array', () => {
			const keyframes: Keyframe[] = [
				{ time: 5, value: 0.5 },
				{ time: 2, value: 0.2 }
			];
			const original = [...keyframes];
			
			sortKeyframes(keyframes);
			expect(keyframes).toEqual(original); // Original unchanged
		});
	});
	
	describe('validateKeyframes', () => {
		it('should pass for properly ordered keyframes', () => {
			const keyframes: Keyframe[] = [
				{ time: 0, value: 0 },
				{ time: 2, value: 0.5 },
				{ time: 4, value: 1 }
			];
			
			const result = validateKeyframes(keyframes);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
		
		it('should detect out of order keyframes', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.5 },
				{ time: 1, value: 0.2 }
			];
			
			const result = validateKeyframes(keyframes);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain('not after');
		});
		
		it('should detect keyframes too close together', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.5 },
				{ time: 2.01, value: 0.6 }
			];
			
			const result = validateKeyframes(keyframes);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain('too close');
		});
		
		it('should pass for single or empty keyframe arrays', () => {
			expect(validateKeyframes([]).valid).toBe(true);
			expect(validateKeyframes([{ time: 1, value: 0.5 }]).valid).toBe(true);
		});
	});
	
	describe('findKeyframeIndex', () => {
		it('should find keyframe at exact time', () => {
			const keyframes: Keyframe[] = [
				{ time: 0, value: 0 },
				{ time: 2.5, value: 0.5 },
				{ time: 5, value: 1 }
			];
			
			expect(findKeyframeIndex(keyframes, 2.5)).toBe(1);
		});
		
		it('should find keyframe within tolerance', () => {
			const keyframes: Keyframe[] = [
				{ time: 0, value: 0 },
				{ time: 2.5, value: 0.5 }
			];
			
			expect(findKeyframeIndex(keyframes, 2.505)).toBe(1);
			expect(findKeyframeIndex(keyframes, 2.495)).toBe(1);
		});
		
		it('should return -1 if not found', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.5 }
			];
			
			expect(findKeyframeIndex(keyframes, 10)).toBe(-1);
		});
		
		it('should respect custom tolerance', () => {
			const keyframes: Keyframe[] = [
				{ time: 2, value: 0.5 }
			];
			
			expect(findKeyframeIndex(keyframes, 2.05, 0.001)).toBe(-1);
			expect(findKeyframeIndex(keyframes, 2.05, 0.1)).toBe(0);
		});
	});
});
