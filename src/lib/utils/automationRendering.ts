import type { Keyframe } from '$lib/timeline/types';

/**
 * Shared automation lane rendering utilities for canvas-based components.
 * These functions can be used by both Timeline and AutomationLane components
 * to ensure consistent visual rendering.
 */

export interface AutomationRenderingOptions {
	/**
	 * The 2D rendering context to draw on
	 */
	ctx: CanvasRenderingContext2D;
	
	/**
	 * Array of keyframes to render
	 */
	keyframes: Keyframe[];
	
	/**
	 * X position of the lane (left edge)
	 */
	x: number;
	
	/**
	 * Y position of the lane (top edge)
	 */
	y: number;
	
	/**
	 * Width of the lane
	 */
	width: number;
	
	/**
	 * Height of the lane
	 */
	height: number;
	
	/**
	 * Pixels per second for time-to-X conversion
	 */
	pixelsPerSecond: number;
	
	/**
	 * Minimum parameter value (default: 0)
	 */
	minValue?: number;
	
	/**
	 * Maximum parameter value (default: 1)
	 */
	maxValue?: number;
	
	/**
	 * Time of the selected keyframe, if any
	 */
	selectedKeyframeTime?: number | null;
	
	/**
	 * Size of keyframe markers (default: 8)
	 */
	keyframeSize?: number;
	
	/**
	 * Parameter name to display (optional)
	 */
	parameterName?: string;
	
	/**
	 * Shape to use for keyframes: 'diamond' or 'circle' (default: 'diamond')
	 */
	keyframeShape?: 'diamond' | 'circle';
}

/**
 * Render a complete automation lane background, border, and label
 */
export function renderAutomationLaneBackground(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	parameterName?: string
): void {
	// Lane background
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(x, y, width, height);

	// Lane border
	ctx.strokeStyle = '#333';
	ctx.lineWidth = 1;
	ctx.strokeRect(x, y, width, height);

	// Parameter name
	if (parameterName) {
		ctx.fillStyle = '#888';
		ctx.font = '10px sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText(parameterName, x + 5, y + 12);
	}
}

/**
 * Convert a keyframe value to Y coordinate within the lane
 * @param value - Keyframe value (0-1 range typically)
 * @param laneY - Top Y position of the lane
 * @param laneHeight - Height of the lane
 * @param minValue - Minimum value (default: 0)
 * @param maxValue - Maximum value (default: 1)
 * @returns Y coordinate in pixels
 */
export function valueToY(
	value: number,
	laneY: number,
	laneHeight: number,
	minValue = 0,
	maxValue = 1
): number {
	const normalizedValue = (value - minValue) / (maxValue - minValue);
	// Top = 1.0 (high value), Bottom = 0.0 (low value)
	return laneY + (1 - normalizedValue) * (laneHeight - 4) + 2;
}

/**
 * Convert Y coordinate to keyframe value
 * @param y - Y coordinate in pixels
 * @param laneY - Top Y position of the lane
 * @param laneHeight - Height of the lane
 * @param minValue - Minimum value (default: 0)
 * @param maxValue - Maximum value (default: 1)
 * @returns Keyframe value
 */
export function yToValue(
	y: number,
	laneY: number,
	laneHeight: number,
	minValue = 0,
	maxValue = 1
): number {
	const normalizedValue = 1 - (y - laneY - 2) / (laneHeight - 4);
	return minValue + normalizedValue * (maxValue - minValue);
}

/**
 * Render the automation curve line connecting keyframes
 */
export function renderAutomationCurve(options: AutomationRenderingOptions): void {
	const {
		ctx,
		keyframes,
		x,
		y,
		height,
		pixelsPerSecond,
		minValue = 0,
		maxValue = 1
	} = options;

	if (keyframes.length === 0) return;

	ctx.strokeStyle = '#4a9eff';
	ctx.lineWidth = 2;
	ctx.beginPath();

	keyframes.forEach((keyframe, i) => {
		const kfX = x + keyframe.time * pixelsPerSecond;
		const kfY = valueToY(keyframe.value, y, height, minValue, maxValue);

		if (i === 0) {
			ctx.moveTo(kfX, kfY);
		} else {
			ctx.lineTo(kfX, kfY);
		}
	});

	ctx.stroke();
}

/**
 * Render keyframe markers (diamonds or circles)
 */
export function renderKeyframes(options: AutomationRenderingOptions): void {
	const {
		ctx,
		keyframes,
		x,
		y,
		height,
		pixelsPerSecond,
		minValue = 0,
		maxValue = 1,
		selectedKeyframeTime = null,
		keyframeSize = 8,
		keyframeShape = 'diamond'
	} = options;

	keyframes.forEach((keyframe) => {
		const kfX = x + keyframe.time * pixelsPerSecond;
		const kfY = valueToY(keyframe.value, y, height, minValue, maxValue);

		const isSelected =
			selectedKeyframeTime !== null &&
			Math.abs(keyframe.time - selectedKeyframeTime) < 0.01;

		if (keyframeShape === 'diamond') {
			renderDiamondKeyframe(ctx, kfX, kfY, keyframeSize, isSelected);
		} else {
			renderCircleKeyframe(ctx, kfX, kfY, keyframeSize, isSelected);
		}
	});
}

/**
 * Render a diamond-shaped keyframe marker
 */
function renderDiamondKeyframe(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	isSelected: boolean
): void {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(Math.PI / 4);
	ctx.fillStyle = isSelected ? '#ff9933' : '#4a9eff';
	ctx.fillRect(-size / 2, -size / 2, size, size);
	ctx.strokeStyle = isSelected ? '#ffcc00' : '#fff';
	ctx.lineWidth = isSelected ? 2 : 1;
	ctx.strokeRect(-size / 2, -size / 2, size, size);
	ctx.restore();
}

/**
 * Render a circular keyframe marker
 */
function renderCircleKeyframe(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	isSelected: boolean
): void {
	ctx.fillStyle = isSelected ? '#ff9500' : '#4a9eff';
	ctx.beginPath();
	ctx.arc(x, y, size / 2, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 1;
	ctx.stroke();
}

/**
 * Render a complete automation lane (background + curve + keyframes)
 */
export function renderAutomationLane(options: AutomationRenderingOptions): void {
	const { ctx, x, y, width, height, parameterName } = options;

	renderAutomationLaneBackground(ctx, x, y, width, height, parameterName);
	renderAutomationCurve(options);
	renderKeyframes(options);
}

/**
 * Hit-test to find a keyframe at given coordinates
 * @returns The keyframe at the position, or null if none found
 */
export function hitTestKeyframe(
	keyframes: Keyframe[],
	mouseX: number,
	mouseY: number,
	laneX: number,
	laneY: number,
	laneHeight: number,
	pixelsPerSecond: number,
	keyframeSize: number,
	minValue = 0,
	maxValue = 1
): Keyframe | null {
	for (const keyframe of keyframes) {
		const kfX = laneX + keyframe.time * pixelsPerSecond;
		const kfY = valueToY(keyframe.value, laneY, laneHeight, minValue, maxValue);

		const dx = mouseX - kfX;
		const dy = mouseY - kfY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < keyframeSize) {
			return keyframe;
		}
	}
	return null;
}
