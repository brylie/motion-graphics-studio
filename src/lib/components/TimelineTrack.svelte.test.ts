import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import TimelineTrack from './TimelineTrack.svelte';
import type { Track } from '$lib/timeline/types';

describe('TimelineTrack', () => {
	let mockTrack: Track;

	beforeEach(() => {
		mockTrack = {
			id: 'track-1',
			name: 'Track 1',
			clips: [],
			muted: false,
			solo: false,
		};
	});

	it('renders track name and controls', () => {
		const { getByText } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond: 50,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		expect(getByText('Track 1')).toBeTruthy();
		expect(getByText('M')).toBeTruthy(); // Mute button
		expect(getByText('S')).toBeTruthy(); // Solo button
	});

	it('calculates correct track height without automation', () => {
		const { container } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond: 50,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		const trackElement = container.querySelector('.timeline-track') as HTMLElement;
		expect(trackElement.style.minHeight).toBe('60px'); // TRACK_HEIGHT only
	});

	it('calculates correct track height with automation lanes', () => {
		mockTrack.clips = [
			{
				id: 'clip-1',
				shaderId: 'plasma',
				shaderName: 'Plasma',
				startTime: 0,
				duration: 10,
				automation: [
					{
						parameterName: 'speed',
						keyframes: [
							{ time: 0, value: 0 },
							{ time: 5, value: 50 },
						],
					},
					{
						parameterName: 'scale',
						keyframes: [
							{ time: 0, value: 1 },
							{ time: 5, value: 2 },
						],
					},
				],
			},
		];

		const { container } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond: 50,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		const trackElement = container.querySelector('.timeline-track') as HTMLElement;
		// TRACK_HEIGHT (60) + 2 automation lanes * AUTOMATION_LANE_HEIGHT (40) = 140px
		expect(trackElement.style.minHeight).toBe('140px');
	});

	it('renders automation lanes in separate rows', () => {
		mockTrack.clips = [
			{
				id: 'clip-1',
				shaderId: 'plasma',
				shaderName: 'Plasma',
				startTime: 0,
				duration: 10,
				automation: [
					{
						parameterName: 'speed',
						keyframes: [{ time: 0, value: 0 }],
					},
					{
						parameterName: 'scale',
						keyframes: [{ time: 0, value: 1 }],
					},
				],
			},
		];

		const { container } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond: 50,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		const automationRows = container.querySelectorAll('.automation-lane-row');
		expect(automationRows.length).toBe(2);
	});

	it('stacks automation lanes vertically without overlap', () => {
		mockTrack.clips = [
			{
				id: 'clip-1',
				shaderId: 'plasma',
				shaderName: 'Plasma',
				startTime: 0,
				duration: 10,
				automation: [
					{
						parameterName: 'speed',
						keyframes: [{ time: 0, value: 0 }],
					},
					{
						parameterName: 'scale',
						keyframes: [{ time: 0, value: 1 }],
					},
				],
			},
		];

		const { container } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond: 50,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		const automationRows = container.querySelectorAll('.automation-lane-row');
		
		// Each row should have its own height
		automationRows.forEach((row) => {
			const element = row as HTMLElement;
			expect(element.style.height).toBe('40px'); // AUTOMATION_LANE_HEIGHT
		});

		// The automation lanes container should use flexbox
		const automationLanesContainer = container.querySelector('.automation-lanes') as HTMLElement;
		const computedStyle = window.getComputedStyle(automationLanesContainer);
		expect(computedStyle.display).toBe('flex');
		expect(computedStyle.flexDirection).toBe('column');
	});

	it('groups automation by parameter name across clips', () => {
		mockTrack.clips = [
			{
				id: 'clip-1',
				shaderId: 'plasma',
				shaderName: 'Plasma',
				startTime: 0,
				duration: 5,
				automation: [
					{
						parameterName: 'speed',
						keyframes: [{ time: 0, value: 0 }],
					},
				],
			},
			{
				id: 'clip-2',
				shaderId: 'ripples',
				shaderName: 'Ripples',
				startTime: 6,
				duration: 4,
				automation: [
					{
						parameterName: 'speed',
						keyframes: [{ time: 0, value: 50 }],
					},
				],
			},
		];

		const { container } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond: 50,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		// Should only have 1 row for 'speed' parameter shared across both clips
		const automationRows = container.querySelectorAll('.automation-lane-row');
		expect(automationRows.length).toBe(1);

		// Both clips should render their automation in the same row
		const wrappers = container.querySelectorAll('.automation-lane-wrapper');
		expect(wrappers.length).toBe(2);
	});

	it('positions automation lanes correctly relative to clip start time', () => {
		const pixelsPerSecond = 50;
		mockTrack.clips = [
			{
				id: 'clip-1',
				shaderId: 'plasma',
				shaderName: 'Plasma',
				startTime: 2,
				duration: 5,
				automation: [
					{
						parameterName: 'speed',
						keyframes: [{ time: 0, value: 0 }],
					},
				],
			},
		];

		const { container } = render(TimelineTrack, {
			props: {
				track: mockTrack,
				pixelsPerSecond,
				selectedClipId: null,
				selectedKeyframe: null,
			},
		});

		const wrapper = container.querySelector('.automation-lane-wrapper') as HTMLElement;
		const expectedLeft = 2 * pixelsPerSecond; // startTime * pixelsPerSecond
		const expectedWidth = 5 * pixelsPerSecond; // duration * pixelsPerSecond
		
		expect(wrapper.style.left).toBe(`${expectedLeft}px`);
		expect(wrapper.style.width).toBe(`${expectedWidth}px`);
	});
});
