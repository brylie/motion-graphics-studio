import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { timeline, timelineActions } from './timeline';

describe('Timeline Store', () => {
	beforeEach(() => {
		// Reset timeline to initial state
		timeline.set({
			tracks: [],
			duration: 60
		});
	});

	describe('Track Management', () => {
		it('should add a new track', () => {
			timelineActions.addTrack();
			const state = get(timeline);
			
			expect(state.tracks).toHaveLength(1);
			expect(state.tracks[0].name).toBe('Track 1');
			expect(state.tracks[0].clips).toHaveLength(0);
		});

		it('should add multiple tracks', () => {
			timelineActions.addTrack();
			timelineActions.addTrack();
			const state = get(timeline);
			
			expect(state.tracks).toHaveLength(2);
			expect(state.tracks[1].name).toBe('Track 2');
		});

		it('should remove a track', () => {
			timelineActions.addTrack();
			const state = get(timeline);
			const trackId = state.tracks[0].id;
			
			timelineActions.removeTrack(trackId);
			const newState = get(timeline);
			
			expect(newState.tracks).toHaveLength(0);
		});
	});

	describe('Keyframe Management', () => {
		let clipId: string;

		beforeEach(() => {
			// Add a track and clip for keyframe tests
			timelineActions.addTrack();
			const state = get(timeline);
			const trackId = state.tracks[0].id;
			timelineActions.addClip(trackId, 'test-shader', 0, 10);
			const updatedState = get(timeline);
			clipId = updatedState.tracks[0].clips[0].id;
		});

		it('should add a keyframe', () => {
			timelineActions.addKeyframe(clipId, 'testParam', 5, 100);
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			const curve = clip.automation.find(c => c.parameterName === 'testParam');
			expect(curve).toBeDefined();
			expect(curve?.keyframes).toHaveLength(1);
			expect(curve?.keyframes[0].time).toBe(5);
			expect(curve?.keyframes[0].value).toBe(100);
		});

		it('should remove a keyframe', () => {
			timelineActions.addKeyframe(clipId, 'testParam', 5, 100);
			timelineActions.removeKeyframe(clipId, 'testParam', 5);
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			// When all keyframes are removed, the curve should be removed entirely
			const curve = clip.automation.find(c => c.parameterName === 'testParam');
			expect(curve).toBeUndefined();
		});

		it('should update keyframe value', () => {
			timelineActions.addKeyframe(clipId, 'testParam', 5, 100);
			timelineActions.addKeyframe(clipId, 'testParam', 5, 200); // Update at same time
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			const curve = clip.automation.find(c => c.parameterName === 'testParam');
			expect(curve?.keyframes).toHaveLength(1);
			expect(curve?.keyframes[0].value).toBe(200);
		});

		it('should sort keyframes by time', () => {
			timelineActions.addKeyframe(clipId, 'testParam', 8, 100);
			timelineActions.addKeyframe(clipId, 'testParam', 2, 50);
			timelineActions.addKeyframe(clipId, 'testParam', 5, 75);
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			const curve = clip.automation.find(c => c.parameterName === 'testParam');
			expect(curve?.keyframes.map(kf => kf.time)).toEqual([2, 5, 8]);
		});

		it('should clear all keyframes for a parameter', () => {
			timelineActions.addKeyframe(clipId, 'testParam', 2, 50);
			timelineActions.addKeyframe(clipId, 'testParam', 5, 75);
			timelineActions.addKeyframe(clipId, 'testParam', 8, 100);
			
			timelineActions.clearKeyframes(clipId, 'testParam');
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			const curve = clip.automation.find(c => c.parameterName === 'testParam');
			expect(curve).toBeUndefined();
		});
	});

	describe('Keyframe Bounds', () => {
		let clipId: string;

		beforeEach(() => {
			timelineActions.addTrack();
			const state = get(timeline);
			const trackId = state.tracks[0].id;
			timelineActions.addClip(trackId, 'test-shader', 0, 10);
			const updatedState = get(timeline);
			clipId = updatedState.tracks[0].clips[0].id;
		});

		it('should return null when no keyframes exist', () => {
			const bounds = timelineActions.getKeyframeBounds(clipId);
			expect(bounds).toBeNull();
		});

		it('should calculate correct bounds for single keyframe', () => {
			timelineActions.addKeyframe(clipId, 'testParam', 5, 100);
			const bounds = timelineActions.getKeyframeBounds(clipId);
			
			expect(bounds).toEqual({ min: 5, max: 5 });
		});

		it('should calculate correct bounds for multiple keyframes', () => {
			timelineActions.addKeyframe(clipId, 'param1', 2, 50);
			timelineActions.addKeyframe(clipId, 'param1', 8, 100);
			timelineActions.addKeyframe(clipId, 'param2', 4, 75);
			
			const bounds = timelineActions.getKeyframeBounds(clipId);
			expect(bounds).toEqual({ min: 2, max: 8 });
		});

		it('should handle keyframes across multiple parameters', () => {
			timelineActions.addKeyframe(clipId, 'param1', 1, 10);
			timelineActions.addKeyframe(clipId, 'param2', 9, 90);
			
			const bounds = timelineActions.getKeyframeBounds(clipId);
			expect(bounds).toEqual({ min: 1, max: 9 });
		});
	});

	describe('Clip Duration and Position', () => {
		let clipId: string;

		beforeEach(() => {
			timelineActions.addTrack();
			const state = get(timeline);
			const trackId = state.tracks[0].id;
			timelineActions.addClip(trackId, 'test-shader', 10, 5);
			const updatedState = get(timeline);
			clipId = updatedState.tracks[0].clips[0].id;
		});

		it('should update clip position', () => {
			timelineActions.updateClipTime(clipId, 20);
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			expect(clip.startTime).toBe(20);
		});

		it('should update clip duration', () => {
			timelineActions.updateClipDuration(clipId, 10);
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			expect(clip.duration).toBe(10);
		});

		it('should maintain minimum clip duration', () => {
			timelineActions.updateClipDuration(clipId, 0);
			const state = get(timeline);
			const clip = state.tracks[0].clips[0];
			
			expect(clip.duration).toBe(0.1); // Minimum duration
		});
	});
});
