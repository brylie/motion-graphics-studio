import { writable, derived } from 'svelte/store';
import type { Timeline, Track, Clip, TimelineViewState } from './types';
import { v4 as uuidv4 } from 'uuid';

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

// Timeline store
export const timeline = writable<Timeline>(createInitialTimeline());

// View state store
export const timelineView = writable<TimelineViewState>({
	pixelsPerSecond: 50, // 50 pixels per second default zoom
	scrollX: 0,
	selectedClipId: null,
	selectedTrackId: null
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
					const newClip: Clip = {
						id: uuidv4(),
						shaderId: shaderName,
						shaderName,
						startTime,
						duration,
						parameters: {},
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
	 * Update clip position
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
	}
};
