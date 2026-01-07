// Timeline Data Structures

export interface Keyframe {
	time: number; // In seconds
	value: number;
}

export interface AutomationCurve {
	parameterName: string;
	keyframes: Keyframe[];
}

export interface Clip {
	id: string;
	shaderId: string; // Reference to loaded shader
	shaderName: string;
	startTime: number; // In seconds
	duration: number; // In seconds
	parameters: { [key: string]: any }; // Current parameter values
	automation: AutomationCurve[];
	alpha: number; // Track alpha/opacity
}

export interface Track {
	id: string;
	name: string;
	clips: Clip[];
	muted: boolean;
	solo: boolean;
	height: number; // In pixels for UI
}

export interface Timeline {
	tracks: Track[];
	duration: number; // Total timeline duration in seconds
	bpm: number; // For musical timing
}

export interface PlaybackState {
	isPlaying: boolean;
	currentTime: number; // In seconds
	loop: boolean;
	loopStart: number;
	loopEnd: number;
}

// UI/Interaction types
export interface TimelineViewState {
	pixelsPerSecond: number; // Zoom level
	scrollX: number; // Horizontal scroll position in pixels
	selectedClipId: string | null;
	selectedTrackId: string | null;
	selectedKeyframe: { clipId: string; paramName: string; time: number } | null;
}

export interface DragState {
	clipId: string;
	startX: number;
	initialTime: number;
	mode: 'move' | 'resize-left' | 'resize-right';
}

/**
 * Interpolate between keyframes
 */
export function interpolateKeyframes(keyframes: Keyframe[], time: number): number {
	if (keyframes.length === 0) return 0;
	if (keyframes.length === 1) return keyframes[0].value;
	
	// Find surrounding keyframes
	let before: Keyframe | null = null;
	let after: Keyframe | null = null;
	
	for (let i = 0; i < keyframes.length; i++) {
		if (keyframes[i].time <= time) {
			before = keyframes[i];
		}
		if (keyframes[i].time >= time && !after) {
			after = keyframes[i];
			break;
		}
	}
	
	// Before first keyframe
	if (!before && after) return after.value;
	// After last keyframe
	if (before && !after) return before.value;
	// Between keyframes - linear interpolation
	if (before && after) {
		const t = (time - before.time) / (after.time - before.time);
		return before.value + (after.value - before.value) * t;
	}
	
	return 0;
}

/**
 * Get active clips at a specific time
 */
export function getActiveClips(track: Track, time: number): Clip[] {
	return track.clips.filter(clip => {
		const endTime = clip.startTime + clip.duration;
		return time >= clip.startTime && time < endTime;
	});
}

/**
 * Get parameter value at specific time with automation
 */
export function getParameterValue(clip: Clip, parameterName: string, time: number): any {
	// Find automation curve for this parameter
	const curve = clip.automation.find(c => c.parameterName === parameterName);
	
	if (curve && curve.keyframes.length > 0) {
		// Use automation
		return interpolateKeyframes(curve.keyframes, time - clip.startTime);
	}
	
	// Use static value
	return clip.parameters[parameterName];
}
