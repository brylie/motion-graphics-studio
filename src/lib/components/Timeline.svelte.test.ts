import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { render } from '@testing-library/svelte';
import Timeline from './Timeline.svelte';
import { dragDropStore } from '$lib/stores/dragDrop';
import { timeline, timelineActions, timelineView } from '$lib/stores/timeline';

const firstTrack = {
	id: 'track-1',
	name: 'Track 1',
	clips: [],
	muted: false,
	solo: false,
	height: 28
};

const secondTrack = {
	id: 'track-2',
	name: 'Track 2',
	clips: [],
	muted: false,
	solo: false,
	height: 28
};

function createDragData(
	effectAllowed: DataTransfer['effectAllowed'],
	payload: Record<string, string>
) {
	const data = new Map([['application/json', JSON.stringify(payload)]]);
	return {
		effectAllowed,
		dropEffect: 'none',
		getData: (format: string) => data.get(format) || ''
	} as unknown as DataTransfer;
}

function dispatchDragEvent(
	target: Element,
	type: 'dragover' | 'drop',
	dataTransfer: DataTransfer
) {
	const event = new Event(type, {
		bubbles: true,
		cancelable: true
	}) as DragEvent;
	Object.defineProperties(event, {
		clientX: { value: 180 },
		clientY: { value: 14 },
		dataTransfer: { value: dataTransfer }
	});
	target.dispatchEvent(event);
}

describe('Timeline drag and drop', () => {
	beforeEach(() => {
		timeline.set({
			tracks: [{ ...firstTrack }, { ...secondTrack }],
			duration: 60,
			bpm: 120
		});
		timelineView.set({
			pixelsPerSecond: 50,
			selectedClipId: null,
			selectedTrackId: null,
			selectedKeyframe: null
		});
		dragDropStore.reset();
	});

	it('accepts a library shader as a copy and adds it to the drop track', () => {
		const { container } = render(Timeline);
		const track = container.querySelector('[data-track-id="track-1"]');
		expect(track).toBeTruthy();

		dragDropStore.startDrag('shader', { shaderId: 'Plasma.fs' });
		const dataTransfer = createDragData('copy', {
			type: 'shader',
			shaderId: 'Plasma.fs'
		});

		dispatchDragEvent(track!, 'dragover', dataTransfer);
		expect(dataTransfer.dropEffect).toBe('copy');

		dispatchDragEvent(track!, 'drop', dataTransfer);
		const droppedClip = get(timeline).tracks[0].clips[0];
		expect(droppedClip?.shaderId).toBe('Plasma.fs');
		expect(droppedClip?.duration).toBe(5);
	});

	it('advertises existing clip drags as moves', () => {
		timelineActions.addClip('track-1', 'Plasma.fs', 0, 5);
		const clipId = get(timeline).tracks[0].clips[0]?.id;
		expect(clipId).toBeTruthy();

		const { container } = render(Timeline);
		const track = container.querySelector('[data-track-id="track-2"]');
		expect(track).toBeTruthy();

		dragDropStore.startDrag('clip', { clipId });
		const dataTransfer = createDragData('move', {
			type: 'clip',
			clipId: clipId!
		});

		dispatchDragEvent(track!, 'dragover', dataTransfer);
		expect(dataTransfer.dropEffect).toBe('move');
	});
});
