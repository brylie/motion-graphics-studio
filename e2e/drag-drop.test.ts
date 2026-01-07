import { test, expect } from '@playwright/test';

test.describe('Drag and Drop', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for timeline to be ready
		await page.waitForSelector('.timeline-container');
	});

	test('should drop shader on track 1', async ({ page }) => {
		// Find a shader in the library
		const shaderCard = page.locator('.shader-card').first();
		await expect(shaderCard).toBeVisible();

		// Get track 1
		const track1 = page.locator('[data-track-id]').first();
		await expect(track1).toBeVisible();

		// Drag shader to track 1
		await shaderCard.dragTo(track1, {
			targetPosition: { x: 200, y: 20 }
		});

		// Verify clip was created on track 1
		const clip = track1.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Verify clip count
		const clipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.clips?.length || 0;
		});
		expect(clipCount).toBeGreaterThan(0);
	});

	test('should drop shader on track 2', async ({ page }) => {
		// Find a shader in the library
		const shaderCard = page.locator('.shader-card').first();
		await expect(shaderCard).toBeVisible();

		// Get track 2 (second track)
		const tracks = page.locator('[data-track-id]');
		const track2 = tracks.nth(1);
		await expect(track2).toBeVisible();

		// Drag shader to track 2
		await shaderCard.dragTo(track2, {
			targetPosition: { x: 200, y: 20 }
		});

		// Verify clip was created on track 2
		const clip = track2.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Verify clip count on track 2
		const clipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[1]?.clips?.length || 0;
		});
		expect(clipCount).toBeGreaterThan(0);
	});

	test('should drop shader on track 3', async ({ page }) => {
		// Find a shader in the library
		const shaderCard = page.locator('.shader-card').first();
		await expect(shaderCard).toBeVisible();

		// Get track 3 (third track)
		const tracks = page.locator('[data-track-id]');
		const track3 = tracks.nth(2);

		// Scroll track 3 into view if needed
		await track3.scrollIntoViewIfNeeded();
		await expect(track3).toBeVisible();

		// Drag shader to track 3
		await shaderCard.dragTo(track3, {
			targetPosition: { x: 200, y: 20 }
		});

		// Verify clip was created on track 3
		const clip = track3.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Verify clip count on track 3
		const clipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[2]?.clips?.length || 0;
		});
		expect(clipCount).toBeGreaterThan(0);
	});

	test('should drag clip from track 1 to track 2', async ({ page }) => {
		// First, add a clip to track 1
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore.get();
			if (state.tracks.length > 0) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
			}
		});

		// Wait for clip to appear
		const track1 = page.locator('[data-track-id]').first();
		const clip = track1.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Get track 2
		const tracks = page.locator('[data-track-id]');
		const track2 = tracks.nth(1);
		await expect(track2).toBeVisible();

		// Drag clip from track 1 to track 2
		await clip.dragTo(track2, {
			targetPosition: { x: 300, y: 20 }
		});

		// Verify clip is now on track 2
		const track2Clip = track2.locator('.timeline-clip').first();
		await expect(track2Clip).toBeVisible();

		// Verify track 1 has no clips
		const track1ClipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.clips?.length || 0;
		});
		expect(track1ClipCount).toBe(0);

		// Verify track 2 has 1 clip
		const track2ClipCount = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[1]?.clips?.length || 0;
		});
		expect(track2ClipCount).toBe(1);
	});

	test('should drag clip from track 1 to track 3', async ({ page }) => {
		// First, add a clip to track 1
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore.get();
			if (state.tracks.length > 0) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
			}
		});

		// Wait for clip to appear
		const track1 = page.locator('[data-track-id]').first();
		const clip = track1.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Get track 3
		const tracks = page.locator('[data-track-id]');
		const track3 = tracks.nth(2);
		await track3.scrollIntoViewIfNeeded();
		await expect(track3).toBeVisible();

		// Drag clip from track 1 to track 3
		await clip.dragTo(track3, {
			targetPosition: { x: 300, y: 20 }
		});

		// Verify clip is now on track 3
		const track3Clip = track3.locator('.timeline-clip').first();
		await expect(track3Clip).toBeVisible();

		// Verify track 1 has no clips and track 3 has 1 clip
		const counts = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return {
				track1: state?.tracks?.[0]?.clips?.length || 0,
				track3: state?.tracks?.[2]?.clips?.length || 0
			};
		});
		expect(counts.track1).toBe(0);
		expect(counts.track3).toBe(1);
	});

	test('should preserve clip properties when moving between tracks', async ({ page }) => {
		// Add a clip with automation to track 1
		const clipId = await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore.get();
			if (state.tracks.length > 0) {
				const trackId = state.tracks[0].id;
				actions.addClip(trackId, 'Plasma.fs', 2.0, 5.0);

				// Get the clip ID
				const updatedState = (window as any).__timelineStore.get();
				const clip = updatedState.tracks[0].clips[0];

				// Add some keyframes
				actions.addKeyframe(clip.id, 'speed', 1.0, 0.5);
				actions.addKeyframe(clip.id, 'speed', 3.0, 0.8);

				return clip.id;
			}
			return null;
		});

		expect(clipId).not.toBeNull();

		// Wait for clip to appear
		const track1 = page.locator('[data-track-id]').first();
		const clip = track1.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Get track 2
		const tracks = page.locator('[data-track-id]');
		const track2 = tracks.nth(1);

		// Drag clip to track 2
		await clip.dragTo(track2, {
			targetPosition: { x: 300, y: 20 }
		});

		// Verify automation was preserved
		const hasAutomation = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			const track2Clip = state?.tracks?.[1]?.clips?.[0];
			if (!track2Clip) return false;

			const speedCurve = track2Clip.automation?.find((c: any) => c.parameterName === 'speed');
			return speedCurve && speedCurve.keyframes.length === 2;
		});

		expect(hasAutomation).toBe(true);
	});

	test('should move clip horizontally within same track', async ({ page }) => {
		// Add a clip to track 1
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore.get();
			if (state.tracks.length > 0) {
				actions.addClip(state.tracks[0].id, 'Plasma.fs', 2.0, 5.0);
			}
		});

		// Wait for clip to appear
		const track1 = page.locator('[data-track-id]').first();
		const clip = track1.locator('.timeline-clip').first();
		await expect(clip).toBeVisible();

		// Get initial position
		const initialTime = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.clips?.[0]?.startTime || 0;
		});

		// Drag clip horizontally on same track
		const clipBox = await clip.boundingBox();
		expect(clipBox).not.toBeNull();

		await page.mouse.move(clipBox!.x + clipBox!.width / 2, clipBox!.y + clipBox!.height / 2);
		await page.mouse.down();
		await page.mouse.move(clipBox!.x + 200, clipBox!.y + clipBox!.height / 2);
		await page.mouse.up();

		// Verify clip moved horizontally (time changed)
		const newTime = await page.evaluate(() => {
			const state = (window as any).__timelineStore?.get?.();
			return state?.tracks?.[0]?.clips?.[0]?.startTime || 0;
		});

		expect(newTime).not.toBe(initialTime);
		expect(newTime).toBeGreaterThan(initialTime);
	});
});
