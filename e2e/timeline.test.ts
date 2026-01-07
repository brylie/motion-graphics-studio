import { expect, test } from '@playwright/test';

test.describe('Timeline Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');

		// Wait for the timeline container to be visible with a shorter timeout
		// If this fails, something is fundamentally broken and we should fail fast
		const timeline = page.locator('.timeline-container');
		await timeline.waitFor({ state: 'visible', timeout: 5000 });

		// Verify the store is exposed for testing
		const hasStore = await page.evaluate(() => {
			return typeof (window as any).__timelineStore !== 'undefined';
		});

		if (!hasStore) {
			throw new Error('Timeline store is not exposed on window. Tests cannot proceed.');
		}
	});

	test('should add clip to track', async ({ page }) => {
		// Get initial clip count
		const initialClipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.clips?.length || 0;
		});

		// Add a clip programmatically
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
			}
		});

		// Verify clip was added
		const finalClipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.clips?.length || 0;
		});

		expect(finalClipCount).toBe(initialClipCount + 1);

		// Verify clip is visible in the UI
		const clip = page.locator('[data-track-id]').first().locator('.timeline-clip').first();
		await expect(clip).toBeVisible();
	});

	test('should add and remove keyframes', async ({ page }) => {
		// Add a clip first
		const clipId = await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
				const updatedState = (window as any).__timelineStore?.get?.();
				return updatedState?.tracks?.[0]?.clips?.[0]?.id;
			}
			return null;
		});

		expect(clipId).not.toBeNull();

		// Add a keyframe
		await page.evaluate(({ clipId }) => {
			const actions = (window as any).__timelineActions;
			actions.addKeyframe(clipId, 'speed', 2.0, 0.5);
		}, { clipId });

		// Verify keyframe was added
		const hasKeyframe = await page.evaluate(({ clipId }) => {
			const state = (window as any).__timelineStore?.get?.();
			const clip = state?.tracks?.[0]?.clips?.find((c: any) => c.id === clipId);
			const curve = clip?.automation?.find((c: any) => c.parameterName === 'speed');
			return curve?.keyframes?.length > 0;
		}, { clipId });

		expect(hasKeyframe).toBe(true);

		// Remove the keyframe
		await page.evaluate(({ clipId }) => {
			const actions = (window as any).__timelineActions;
			actions.removeKeyframe(clipId, 'speed', 2.0);
		}, { clipId });

		// Verify keyframe was removed
		const keyframeRemoved = await page.evaluate(({ clipId }) => {
			const state = (window as any).__timelineStore?.get?.();
			const clip = state?.tracks?.[0]?.clips?.find((c: any) => c.id === clipId);
			const curve = clip?.automation?.find((c: any) => c.parameterName === 'speed');
			return curve?.keyframes?.length === 0;
		}, { clipId });

		expect(keyframeRemoved).toBe(true);
	});

	test('should resize clip with absolute mode (default)', async ({ page }) => {
		// Add a clip with keyframes
		const result = await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();

			if (!state?.tracks?.[0]) return { error: 'No track found' };

			// Add clip
			actions.addClip(state.tracks[0].id, 'Plasma.fs', 5.0, 10.0);

			const updatedState = (window as any).__timelineStore?.get?.();
			const clipId = updatedState?.tracks?.[0]?.clips?.[0]?.id;

			if (!clipId) return { error: 'Clip not created' };

			// Add keyframes
			actions.addKeyframe(clipId, 'speed', 2.0, 0.5);
			actions.addKeyframe(clipId, 'speed', 5.0, 0.8);
			actions.addKeyframe(clipId, 'speed', 8.0, 0.3);

			// Get initial state
			const beforeResize = (window as any).__timelineStore?.get?.();
			const clip = beforeResize?.tracks?.[0]?.clips?.[0];
			const initialKeyframes = clip?.automation?.[0]?.keyframes?.map((kf: any) => kf.time) || [];

			// Resize clip (increase duration)
			actions.updateClipDuration(clipId, 15.0);

			// Get final state
			const afterResize = (window as any).__timelineStore?.get?.();
			const resizedClip = afterResize?.tracks?.[0]?.clips?.[0];
			const finalKeyframes = resizedClip?.automation?.[0]?.keyframes?.map((kf: any) => kf.time) || [];

			return {
				initialDuration: 10.0,
				finalDuration: resizedClip?.duration,
				initialKeyframes,
				finalKeyframes,
				keyframesUnchanged: JSON.stringify(initialKeyframes) === JSON.stringify(finalKeyframes)
			};
		});

		if ('error' in result) {
			throw new Error(result.error);
		}

		// In absolute mode, keyframes should stay at same positions
		expect(result.finalDuration).toBe(15.0);
		expect(result.keyframesUnchanged).toBe(true);
	});

	test('should select clip when clicked', async ({ page }) => {
		// Add a clip
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
			}
		});

		// Find and click the clip
		const clip = page.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();
		await clip.click();

		// Verify clip is selected
		const isSelected = await page.evaluate(() => {
			const viewState = (window as any).__timelineViewStore?.get?.();
			return viewState?.selectedClipId !== null;
		});

		expect(isSelected).toBe(true);

		// Verify clip has selected class
		await expect(clip).toHaveClass(/selected/);
	});

	test('should show resize handles when clip is selected', async ({ page }) => {
		// Add a clip
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
			}
		});

		// Find and click the clip to select it
		const clip = page.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();
		await clip.click();

		// Verify resize handles are visible
		const leftHandle = clip.locator('.resize-handle.left');
		const rightHandle = clip.locator('.resize-handle.right');

		await expect(leftHandle).toBeVisible();
		await expect(rightHandle).toBeVisible();
	});

	test('should display clip with correct duration and position', async ({ page }) => {
		// Add a clip at specific position and duration
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 3.0, 7.5);
			}
		});

		// Get clip dimensions
		const clipInfo = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			const viewState = (window as any).__timelineViewStore?.get?.();
			const clip = state?.tracks?.[0]?.clips?.[0];

			return {
				startTime: clip?.startTime,
				duration: clip?.duration,
				pixelsPerSecond: viewState?.pixelsPerSecond || 50
			};
		});

		// Calculate expected position and width
		const expectedLeft = clipInfo.startTime * clipInfo.pixelsPerSecond;
		const expectedWidth = clipInfo.duration * clipInfo.pixelsPerSecond;

		// Get actual clip element style
		const clipElement = page.locator('.timeline-clip').first();
		const clipStyle = await clipElement.getAttribute('style');

		// Verify position and width are in the style
		expect(clipStyle).toContain(`left: ${expectedLeft}px`);
		expect(clipStyle).toContain(`width: ${expectedWidth}px`);
	});

	test('should remove clip from timeline', async ({ page }) => {
		// Add a clip
		const clipId = await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
				const updatedState = (window as any).__timelineStore?.get?.();
				return updatedState?.tracks?.[0]?.clips?.[0]?.id;
			}
			return null;
		});

		expect(clipId).not.toBeNull();

		// Verify clip is visible
		const clip = page.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Remove the clip
		await page.evaluate(({ clipId }) => {
			const actions = (window as any).__timelineActions;
			actions.removeClip(clipId);
		}, { clipId });

		// Verify clip is gone
		await expect(clip).not.toBeVisible();
	});

	test('should update clip time when moved', async ({ page }) => {
		// Add a clip
		const clipId = await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
				const updatedState = (window as any).__timelineStore?.get?.();
				return updatedState?.tracks?.[0]?.clips?.[0]?.id;
			}
			return null;
		});

		expect(clipId).not.toBeNull();

		// Update clip time
		await page.evaluate(({ clipId }) => {
			const actions = (window as any).__timelineActions;
			actions.updateClipTime(clipId, 6.5);
		}, { clipId });

		// Verify new time
		const newTime = await page.evaluate(({ clipId }) => {
			const state = (window as any).__timelineStore?.get?.();
			const clip = state?.tracks?.[0]?.clips?.find((c: any) => c.id === clipId);
			return clip?.startTime;
		}, { clipId });

		expect(newTime).toBe(6.5);
	});

	test('should toggle track mute', async ({ page }) => {
		// Get initial mute state
		const initialMuted = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.muted || false;
		});

		// Click mute button
		const muteButton = page.locator('[data-track-id]').first().locator('button[aria-label*="mute"]').first();
		await muteButton.click();

		// Verify mute state changed
		const newMuted = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.muted || false;
		});

		expect(newMuted).toBe(!initialMuted);
	});

	test('should toggle track solo', async ({ page }) => {
		// Get initial solo state
		const initialSolo = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.solo || false;
		});

		// Click solo button
		const soloButton = page.locator('[data-track-id]').first().locator('button[aria-label*="solo"]').first();
		await soloButton.click();

		// Verify solo state changed
		const newSolo = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.solo || false;
		});

		expect(newSolo).toBe(!initialSolo);
	});

	test('should display automation lanes when keyframes exist', async ({ page }) => {
		// Add a clip with keyframes
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 10.0);
				const updatedState = (window as any).__timelineStore?.get?.();
				const clipId = updatedState?.tracks?.[0]?.clips?.[0]?.id;

				// Add keyframes
				actions.addKeyframe(clipId, 'speed', 2.0, 0.5);
				actions.addKeyframe(clipId, 'speed', 5.0, 0.8);
			}
		});

		// Wait for automation lane to appear
		const automationLane = page.locator('.automation-lane-wrapper').first();
		await expect(automationLane).toBeVisible({ timeout: 2000 });
	});

	test('should handle multiple clips on same track', async ({ page }) => {
		// Add multiple clips
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();
			if (state?.tracks?.[0]) {
				const trackId = state.tracks[0].id;
				actions.addClip(trackId, 'Plasma.fs', 1.0, 3.0);
				actions.addClip(trackId, 'Checkerboard.fs', 5.0, 4.0);
				actions.addClip(trackId, 'Ripples.fs', 10.0, 2.0);
			}
		});

		// Verify all clips are visible
		const clips = page.locator('[data-track-id]').first().locator('.timeline-clip');
		await expect(clips).toHaveCount(3);
	});

	test('should handle clips across multiple tracks', async ({ page }) => {
		// Add clips to different tracks
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore?.get?.();

			if (state?.tracks?.[0]) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 1.0, 3.0);
			}
			if (state?.tracks?.[1]) {
				actions.addClip(state.tracks[1].id, 'Checkerboard.fs', 2.0, 4.0);
			}
			if (state?.tracks?.[2]) {
				actions.addClip(state.tracks[2].id, 'Ripples.fs', 3.0, 2.0);
			}
		});

		// Verify each track has a clip
		const track1Clips = page.locator('[data-track-id]').first().locator('.timeline-clip');
		const track2Clips = page.locator('[data-track-id]').nth(1).locator('.timeline-clip');
		const track3Clips = page.locator('[data-track-id]').nth(2).locator('.timeline-clip');

		await expect(track1Clips).toHaveCount(1);
		await expect(track2Clips).toHaveCount(1);
		await expect(track3Clips).toHaveCount(1);
	});
});
