import { describe, it, expect, beforeEach } from 'vitest';
import { timeline, timelineActions, timelineView, viewActions } from './timeline';
import { get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

describe('Timeline with time-travel debugging', () => {
	// Reset timeline to a clean state before each test
	beforeEach(() => {
		timeline.set({
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
			duration: 60,
			bpm: 120
		});
		timeline.clearHistory(); // Clear history so each test starts fresh
	});
	it('should support undo/redo for track operations', () => {
		// Get initial state
		const initialTracks = get(timeline).tracks;
		expect(initialTracks).toHaveLength(1);

		// Add a track
		timelineActions.addTrack();
		expect(get(timeline).tracks).toHaveLength(2);

		// Undo
		timeline.undo();
		expect(get(timeline).tracks).toHaveLength(1);

		// Redo
		timeline.redo();
		expect(get(timeline).tracks).toHaveLength(2);
	});

	it('should support undo/redo for clip operations', () => {
		const trackId = get(timeline).tracks[0].id;

		// Add clip
		timelineActions.addClip(trackId, 'test-shader', 0, 5);
		expect(get(timeline).tracks[0].clips).toHaveLength(1);

		// Undo
		timeline.undo();
		expect(get(timeline).tracks[0].clips).toHaveLength(0);

		// Redo
		timeline.redo();
		expect(get(timeline).tracks[0].clips).toHaveLength(1);
	});

	it('should support undo/redo for keyframe operations', () => {
		const trackId = get(timeline).tracks[0].id;
		timelineActions.addClip(trackId, 'test-shader', 0, 5);
		const clipId = get(timeline).tracks[0].clips[0].id;

		// Add keyframe
		timelineActions.addKeyframe(clipId, 'testParam', 1.0, 0.5);
		const automation = get(timeline).tracks[0].clips[0].automation;
		expect(automation).toHaveLength(1);
		expect(automation[0].keyframes).toHaveLength(1);

		// Undo
		timeline.undo();
		const automationAfterUndo = get(timeline).tracks[0].clips[0].automation;
		expect(automationAfterUndo).toHaveLength(0);

		// Redo
		timeline.redo();
		const automationAfterRedo = get(timeline).tracks[0].clips[0].automation;
		expect(automationAfterRedo).toHaveLength(1);
		expect(automationAfterRedo[0].keyframes).toHaveLength(1);
	});

	it('should clear forward history when making new changes after undo', () => {
		const trackId = get(timeline).tracks[0].id;

		// Add two clips
		timelineActions.addClip(trackId, 'shader1', 0, 5);
		timelineActions.addClip(trackId, 'shader2', 5, 5);
		expect(get(timeline).tracks[0].clips).toHaveLength(2);

		// Undo once
		timeline.undo();
		expect(get(timeline).tracks[0].clips).toHaveLength(1);

		// Make a new change (this should clear forward history)
		timelineActions.addClip(trackId, 'shader3', 5, 3);
		expect(get(timeline).tracks[0].clips).toHaveLength(2);

		// Should not be able to redo to shader2
		timeline.redo();
		expect(get(timeline).tracks[0].clips).toHaveLength(2);
		expect(get(timeline).tracks[0].clips[1].shaderId).toBe('shader3');
	});

	it('should report canUndo and canRedo correctly', () => {
		// Initial state - nothing to undo
		expect(timeline.canUndo()).toBe(false);
		expect(timeline.canRedo()).toBe(false);

		// Add track
		timelineActions.addTrack();
		expect(timeline.canUndo()).toBe(true);
		expect(timeline.canRedo()).toBe(false);

		// Undo
		timeline.undo();
		expect(timeline.canUndo()).toBe(false);
		expect(timeline.canRedo()).toBe(true);

		// Redo
		timeline.redo();
		expect(timeline.canUndo()).toBe(true);
		expect(timeline.canRedo()).toBe(false);
	});

	it('should handle multiple operations in sequence', () => {
		const trackId = get(timeline).tracks[0].id;

		// Sequence of operations
		timelineActions.addClip(trackId, 'shader1', 0, 5);
		const clipId = get(timeline).tracks[0].clips[0].id;
		timelineActions.addKeyframe(clipId, 'param1', 1.0, 0.5);
		timelineActions.addKeyframe(clipId, 'param1', 2.0, 0.7);
		timelineActions.updateClipDuration(clipId, 10);

		// Undo all operations
		timeline.undo(); // Undo duration change
		expect(get(timeline).tracks[0].clips[0].duration).toBe(5);

		timeline.undo(); // Undo second keyframe
		expect(get(timeline).tracks[0].clips[0].automation[0].keyframes).toHaveLength(1);

		timeline.undo(); // Undo first keyframe
		expect(get(timeline).tracks[0].clips[0].automation).toHaveLength(0);

		timeline.undo(); // Undo clip creation
		expect(get(timeline).tracks[0].clips).toHaveLength(0);

		// Redo all operations
		timeline.redo();
		timeline.redo();
		timeline.redo();
		timeline.redo();

		// Verify final state
		expect(get(timeline).tracks[0].clips[0].duration).toBe(10);
		expect(get(timeline).tracks[0].clips[0].automation[0].keyframes).toHaveLength(2);
	});
});
