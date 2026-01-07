/**
 * Keyframe utilities for managing automation curves
 * 
 * Keyframes are sorted by time (X-axis) and should maintain strict ordering.
 * This module provides utilities for safe keyframe manipulation.
 */

export interface Keyframe {
	time: number;
	value: number;
}

export interface KeyframeConstraints {
	minTime: number;
	maxTime: number;
	minValue?: number;
	maxValue?: number;
	snapGrid?: number;
}

/**
 * Clamp a time value between adjacent keyframes
 * 
 * @param time - The desired time position
 * @param keyframes - All keyframes in the curve (must be sorted)
 * @param currentIndex - Index of the keyframe being moved
 * @param constraints - Min/max bounds for the clip
 * @returns Clamped time that doesn't overlap adjacent keyframes
 */
export function clampTimeToAdjacentKeyframes(
	time: number,
	keyframes: Keyframe[],
	currentIndex: number,
	constraints: KeyframeConstraints
): number {
	const minGap = 0.02; // Minimum gap between keyframes
	
	// Start with constraint bounds
	let minTime = constraints.minTime;
	let maxTime = constraints.maxTime;
	
	// Clamp to left neighbor
	if (currentIndex > 0) {
		const leftKeyframe = keyframes[currentIndex - 1];
		minTime = Math.max(minTime, leftKeyframe.time + minGap);
	}
	
	// Clamp to right neighbor
	if (currentIndex < keyframes.length - 1) {
		const rightKeyframe = keyframes[currentIndex + 1];
		maxTime = Math.min(maxTime, rightKeyframe.time - minGap);
	}
	
	// Apply clamping
	let clampedTime = Math.max(minTime, Math.min(maxTime, time));
	
	// Apply snap grid if specified
	if (constraints.snapGrid) {
		clampedTime = Math.round(clampedTime / constraints.snapGrid) * constraints.snapGrid;
		// Ensure snapping doesn't violate neighbor constraints
		clampedTime = Math.max(minTime, Math.min(maxTime, clampedTime));
	}
	
	return clampedTime;
}

/**
 * Clamp a value within bounds
 */
export function clampValue(
	value: number,
	minValue: number = 0,
	maxValue: number = 1
): number {
	return Math.max(minValue, Math.min(maxValue, value));
}

/**
 * Move a keyframe to a new position with proper clamping
 * 
 * This is the safe way to update a keyframe position - it ensures:
 * - Time ordering is maintained
 * - No keyframes overlap
 * - Values stay within bounds
 * 
 * @returns New time and value (potentially clamped)
 */
export function moveKeyframe(
	keyframes: Keyframe[],
	currentTime: number,
	newTime: number,
	newValue: number,
	constraints: KeyframeConstraints
): { time: number; value: number } {
	// Find the keyframe being moved
	const currentIndex = keyframes.findIndex(kf => 
		Math.abs(kf.time - currentTime) < 0.01
	);
	
	if (currentIndex === -1) {
		throw new Error(`Keyframe at time ${currentTime} not found`);
	}
	
	// Clamp time to prevent overlap
	const clampedTime = clampTimeToAdjacentKeyframes(
		newTime,
		keyframes,
		currentIndex,
		constraints
	);
	
	// Clamp value
	const clampedValue = clampValue(
		newValue,
		constraints.minValue ?? 0,
		constraints.maxValue ?? 1
	);
	
	return {
		time: clampedTime,
		value: clampedValue
	};
}

/**
 * Sort keyframes by time and validate ordering
 */
export function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
	return [...keyframes].sort((a, b) => a.time - b.time);
}

/**
 * Validate that keyframes are properly ordered and don't overlap
 */
export function validateKeyframes(keyframes: Keyframe[]): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	
	if (keyframes.length < 2) {
		return { valid: true, errors };
	}
	
	// Check ordering
	for (let i = 1; i < keyframes.length; i++) {
		const prev = keyframes[i - 1];
		const curr = keyframes[i];
		
		if (curr.time <= prev.time) {
			errors.push(
				`Keyframe ${i} (time=${curr.time}) is not after keyframe ${i-1} (time=${prev.time})`
			);
		}
		
		if (Math.abs(curr.time - prev.time) < 0.02) {
			errors.push(
				`Keyframes ${i-1} and ${i} are too close (${Math.abs(curr.time - prev.time).toFixed(3)}s apart)`
			);
		}
	}
	
	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Find the index of a keyframe at a specific time
 */
export function findKeyframeIndex(
	keyframes: Keyframe[],
	time: number,
	tolerance: number = 0.01
): number {
	return keyframes.findIndex(kf => Math.abs(kf.time - time) < tolerance);
}
