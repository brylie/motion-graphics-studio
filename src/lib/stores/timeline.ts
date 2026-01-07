import { writable, derived, get } from 'svelte/store';
import type { Timeline, Track, Clip, TimelineViewState } from '$lib/timeline/types';
import { v4 as uuidv4 } from 'uuid';
import { shaderLibrary } from './shaders';
import { getDefaultValue } from '$lib/isf/parser';
import { historyStore } from './historyStore';

// Create initial timeline state
function createInitialTimeline(): Timeline {
	return {
		tracks: [
			{
				id: uuidv4(),
				name: 'Track 1',
				clips: [],
				muted: false,
				solo: false,
				height: 100
			}
		],
		duration: 60, // 1 minute default
		bpm: 120
	};
}

// Timeline store with undo/redo capabilities
export const timeline = historyStore<Timeline>(createInitialTimeline());

// View state store
export const timelineView = writable<TimelineViewState>({
	pixelsPerSecond: 50, // 50 pixels per second default zoom
	scrollX: 0,
	selectedClipId: null,
	selectedTrackId: null,
	selectedKeyframe: null
});

// Derived store for selected clip
export const selectedClip = derived(
	[timeline, timelineView],
	([$timeline, $timelineView]) => {
		if (!$timelineView.selectedClipId) return null;
		
		for (const track of $timeline.tracks) {
			const clip = track.clips.find(c => c.id === $timelineView.selectedClipId);
			if (clip) return clip;
		}
		return null;
	}
);

// Timeline actions
export const timelineActions = {
	/**
	 * Get the time bounds of all keyframes in a clip (min and max times)
	 */
	getKeyframeBounds(clipId: string): { min: number; max: number } | null {
		let minTime = Infinity;
		let maxTime = -Infinity;
		let hasKeyframes = false;

		const currentTimeline = get(timeline);
		for (const track of currentTimeline.tracks) {
			const clip = track.clips.find(c => c.id === clipId);
			if (clip) {
				for (const curve of clip.automation) {
					for (const kf of curve.keyframes) {
						hasKeyframes = true;
						minTime = Math.min(minTime, kf.time);
						maxTime = Math.max(maxTime, kf.time);
					}
				}
				break;
			}
		}

		return hasKeyframes ? { min: minTime, max: maxTime } : null;
	},

	/**
	 * Add a new track
	 */
	addTrack() {
		timeline.update(t => {
			const newTrack: Track = {
				id: uuidv4(),
				name: `Track ${t.tracks.length + 1}`,
				clips: [],
				muted: false,
				solo: false,
				height: 100
			};
			return {
				...t,
				tracks: [...t.tracks, newTrack]
			};
		});
	},

	/**
	 * Remove a track
	 */
	removeTrack(trackId: string) {
		timeline.update(t => ({
			...t,
			tracks: t.tracks.filter(track => track.id !== trackId)
		}));
	},

	/**
	 * Add a clip to a track
	 */
	addClip(trackId: string, shaderName: string, startTime: number, duration: number = 5) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => {
				if (track.id === trackId) {
					// Get shader metadata to initialize parameters
					const shaderLibraryState = get(shaderLibrary);
					const shader = shaderLibraryState.shaders.find(s => s.filename === shaderName);
					
					// Initialize parameters with default values from shader
					const parameters: { [key: string]: any } = {};
					if (shader && shader.metadata.INPUTS) {
						for (const input of shader.metadata.INPUTS) {
							// Only include non-image inputs in parameters
							if (input.TYPE !== 'image' && input.TYPE !== 'audio' && input.TYPE !== 'audioFFT') {
								parameters[input.NAME] = getDefaultValue(input);
							}
						}
					}
					
					const newClip: Clip = {
						id: uuidv4(),
						shaderId: shaderName,
						shaderName,
						startTime,
						duration,
						parameters,
						automation: [],
						alpha: 1.0
					};
					return {
						...track,
						clips: [...track.clips, newClip]
					};
				}
				return track;
			});
			return { ...t, tracks };
		});
	},

	/**
	 * Remove a clip
	 */
	removeClip(clipId: string) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.filter(c => c.id !== clipId)
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Update clip position (keyframes stay in same relative position)
	 */
	updateClipTime(clipId: string, startTime: number) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => 
					clip.id === clipId ? { ...clip, startTime } : clip
				)
			}));
			return { ...t, tracks };
		});
		// Note: Keyframes are stored relative to clip start, so they move automatically
	},

	/**
	 * Update clip duration
	 */
	updateClipDuration(clipId: string, duration: number) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => 
					clip.id === clipId ? { ...clip, duration: Math.max(0.1, duration) } : clip
				)
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Update clip parameter
	 */
	updateClipParameter(clipId: string, parameterName: string, value: any) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => {
					if (clip.id === clipId) {
						return {
							...clip,
							parameters: {
								...clip.parameters,
								[parameterName]: value
							}
						};
					}
					return clip;
				})
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Toggle track mute
	 */
	toggleMute(trackId: string) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => 
				track.id === trackId ? { ...track, muted: !track.muted } : track
			);
			return { ...t, tracks };
		});
	},

	/**
	 * Toggle track solo
	 */
	toggleSolo(trackId: string) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => 
				track.id === trackId ? { ...track, solo: !track.solo } : track
			);
			return { ...t, tracks };
		});
	},

	/**
	 * Add keyframe to clip parameter
	 */
	addKeyframe(clipId: string, parameterName: string, time: number, value: number) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => {
					if (clip.id !== clipId) return clip;
					
					// Find or create automation curve
					let automation = [...clip.automation];
					let curveIndex = automation.findIndex(c => c.parameterName === parameterName);
					
					if (curveIndex === -1) {
						// Create new curve
						automation.push({
							parameterName,
							keyframes: [{ time, value }]
						});
					} else {
						// Add keyframe to existing curve (or update if exists at same time)
						const curve = automation[curveIndex];
						const existingIndex = curve.keyframes.findIndex(kf => Math.abs(kf.time - time) < 0.01);
						
						if (existingIndex !== -1) {
							// Update existing keyframe
							curve.keyframes[existingIndex].value = value;
						} else {
							// Add new keyframe and sort
							curve.keyframes.push({ time, value });
							curve.keyframes.sort((a, b) => a.time - b.time);
						}
					}
					
					return { ...clip, automation };
				})
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Remove keyframe at specific time
	 */
	removeKeyframe(clipId: string, parameterName: string, time: number) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => {
					if (clip.id !== clipId) return clip;
					
					const automation = clip.automation.map(curve => {
						if (curve.parameterName !== parameterName) return curve;
						
						return {
							...curve,
							keyframes: curve.keyframes.filter(kf => Math.abs(kf.time - time) >= 0.01)
						};
					}).filter(curve => curve.keyframes.length > 0);
					
					return { ...clip, automation };
				})
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Update keyframe value
	 */
	updateKeyframe(clipId: string, parameterName: string, time: number, value: number) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => {
					if (clip.id !== clipId) return clip;
					
					const automation = clip.automation.map(curve => {
						if (curve.parameterName !== parameterName) return curve;
						
						return {
							...curve,
							keyframes: curve.keyframes.map(kf =>
								Math.abs(kf.time - time) < 0.01 ? { ...kf, value } : kf
							)
						};
					});
					
					return { ...clip, automation };
				})
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Clear all keyframes for a parameter
	 */
	clearKeyframes(clipId: string, parameterName: string) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => {
					if (clip.id !== clipId) return clip;
					
					const automation = clip.automation.filter(c => c.parameterName !== parameterName);
					return { ...clip, automation };
				})
			}));
			return { ...t, tracks };
		});
	},

	/**
	 * Update parameter base value
	 */
	updateParameter(clipId: string, parameterName: string, value: any) {
		timeline.update(t => {
			const tracks = t.tracks.map(track => ({
				...track,
				clips: track.clips.map(clip => {
					if (clip.id !== clipId) return clip;
					
					return {
						...clip,
						parameters: {
							...clip.parameters,
							[parameterName]: value
						}
					};
				})
			}));
			return { ...t, tracks };
		});
	}
};

// View actions
export const viewActions = {
	/**
	 * Set zoom level
	 */
	setZoom(pixelsPerSecond: number) {
		timelineView.update(v => ({
			...v,
			pixelsPerSecond: Math.max(10, Math.min(200, pixelsPerSecond))
		}));
	},

	/**
	 * Set scroll position
	 */
	setScroll(scrollX: number) {
		timelineView.update(v => ({
			...v,
			scrollX: Math.max(0, scrollX)
		}));
	},

	/**
	 * Select clip
	 */
	selectClip(clipId: string | null) {
		timelineView.update(v => ({
			...v,
			selectedClipId: clipId
		}));
	},

	/**
	 * Select track
	 */
	selectTrack(trackId: string | null) {
		timelineView.update(v => ({
			...v,
			selectedTrackId: trackId
		}));
	},

	/**
	 * Select keyframe
	 */
	selectKeyframe(clipId: string | null, paramName: string | null, time: number | null) {
		timelineView.update(v => ({
			...v,
			selectedKeyframe: (clipId && paramName !== null && time !== null)
				? { clipId, paramName, time }
				: null
		}));
	}
};
