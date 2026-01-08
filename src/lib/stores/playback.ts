import { writable, derived } from 'svelte/store';
import type { PlaybackState } from '$lib/timeline/types';

// Create initial playback state
function createInitialPlayback(): PlaybackState {
	return {
		isPlaying: false,
		currentTime: 0,
		loop: false,
		loopStart: 0,
		loopEnd: 60
	};
}

// Playback store
export const playback = writable<PlaybackState>(createInitialPlayback());

// Playback actions
export const playbackActions = {
	/**
	 * Start playback
	 */
	play() {
		playback.update(p => ({ ...p, isPlaying: true }));
	},

	/**
	 * Pause playback
	 */
	pause() {
		playback.update(p => ({ ...p, isPlaying: false }));
	},

	/**
	 * Toggle play/pause
	 */
	togglePlay() {
		playback.update(p => ({ ...p, isPlaying: !p.isPlaying }));
	},

	/**
	 * Stop and reset to beginning
	 */
	stop() {
		playback.update(p => ({ ...p, isPlaying: false, currentTime: 0 }));
	},

	/**
	 * Seek to specific time
	 */
	seek(time: number) {
		playback.update(p => ({ ...p, currentTime: Math.max(0, time) }));
	},

	/**
	 * Update current time (called from render loop)
	 */
	updateTime(deltaTime: number) {
		playback.update(p => {
			if (!p.isPlaying) return p;
			
			let newTime = p.currentTime + deltaTime;
			
			// Handle looping
			if (p.loop) {
				if (newTime >= p.loopEnd) {
					newTime = p.loopStart + (newTime - p.loopEnd);
				}
			}
			
			return { ...p, currentTime: newTime };
		});
	},

	/**
	 * Toggle loop
	 */
	toggleLoop() {
		playback.update(p => ({ ...p, loop: !p.loop }));
	},

	/**
	 * Set loop region
	 */
	setLoopRegion(start: number, end: number) {
		playback.update(p => ({
			...p,
			loopStart: Math.max(0, start),
			loopEnd: Math.max(start, end)
		}));
	}
};

// Format time as MM:SS.CC (minutes:seconds.centiseconds)
export function formatTime(time: number): string {
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	const ms = Math.floor((time % 1) * 100);
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Derived store for formatted time display
export const formattedTime = derived(playback, ($playback) => formatTime($playback.currentTime));
