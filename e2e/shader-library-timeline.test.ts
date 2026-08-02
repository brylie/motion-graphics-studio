import { expect, test } from '@playwright/test';

test.describe('Shader Library and Timeline', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.shader-card').first()).toBeVisible();
		await expect(page.locator('[data-track-id]').first()).toBeVisible();
		await page.waitForFunction(
			() => typeof (window as any).__timelineStore?.get === 'function'
		);
	});

	test('filters the library to generator shaders', async ({ page }) => {
		const shaderCards = page.locator('.shader-card');
		const initialCount = await shaderCards.count();
		expect(initialCount).toBeGreaterThan(0);

		await page.getByRole('button', { name: 'Generator', exact: true }).click();

		await page.waitForFunction(
			(initial) => document.querySelectorAll('.shader-card').length < initial,
			initialCount
		);
		const generatorCount = await shaderCards.count();
		expect(generatorCount).toBeLessThan(initialCount);
		const shaderNames = await shaderCards
			.locator('.shader-name')
			.allTextContents();
		expect(shaderNames).toContain('Plasma');
	});

	test('searches the shader library and restores its results when cleared', async ({
		page
	}) => {
		const search = page.getByPlaceholder('Search shaders...');
		const shaderCards = page.locator('.shader-card');
		const initialCount = await shaderCards.count();
		await search.fill('Kaleidoscope');

		await page.waitForFunction(
			(initial) => document.querySelectorAll('.shader-card').length < initial,
			initialCount
		);
		await expect(
			shaderCards.locator('.shader-name', { hasText: 'Kaleidoscope' })
		).toBeVisible();
		expect(await shaderCards.count()).toBeLessThan(initialCount);

		await search.clear();
		await expect(shaderCards).toHaveCount(initialCount);
	});

	test('adds a library shader to the first track when clicked', async ({
		page
	}) => {
		await page.locator('.shader-card', { hasText: 'Plasma' }).first().click();

		const firstTrack = page.locator('[data-track-id]').first();
		await expect(firstTrack.locator('.timeline-clip')).toHaveCount(1);
		await expect(firstTrack.locator('.timeline-clip')).toContainText(
			'Plasma.fs'
		);

		const droppedClip = await page.evaluate(() => {
			const state = (window as any).__timelineStore.get();
			return state.tracks[0].clips[0];
		});
		expect(droppedClip).toMatchObject({
			shaderId: 'Plasma.fs',
			startTime: 0,
			duration: 5
		});
	});

	test('drags a generator from the library to a timeline track', async ({
		page
	}) => {
		const generator = page
			.locator('.shader-card', { hasText: 'Plasma' })
			.first();
		const secondTrack = page.locator('[data-track-id]').nth(1);

		await generator.dragTo(secondTrack, {
			targetPosition: { x: 180, y: 14 }
		});

		await expect(secondTrack.locator('.timeline-clip')).toHaveCount(1);
		await expect(secondTrack.locator('.timeline-clip')).toContainText(
			'Plasma.fs'
		);

		const droppedClip = await page.evaluate(() => {
			const state = (window as any).__timelineStore.get();
			return state.tracks[1].clips[0];
		});
		expect(droppedClip).toMatchObject({
			shaderId: 'Plasma.fs',
			startTime: 2,
			duration: 5
		});
	});

	test('adds, updates, and removes a parameter keyframe from the panel', async ({
		page
	}) => {
		await page.locator('.shader-card', { hasText: 'Plasma' }).first().click();

		const firstTrack = page.locator('[data-track-id]').first();
		const clip = firstTrack.locator('.timeline-clip');
		await clip.click();

		const parameterPanel = page.locator('.parameter-panel');
		const speedParameter = parameterPanel
			.locator('.parameter-row.animatable')
			.filter({ hasText: 'speed' });
		await expect(speedParameter).toBeVisible();

		await speedParameter.getByTitle('Add keyframe at current time').click();
		await expect(firstTrack.locator('.automation-lane-row')).toHaveCount(1);
		await expect(parameterPanel.locator('.automation-row')).toContainText(
			'speed'
		);

		await speedParameter.locator('input[type="number"]').fill('0.5');
		const keyframe = await page.evaluate(() => {
			const state = (window as any).__timelineStore.get();
			return state.tracks[0].clips[0].automation.find(
				(curve: any) => curve.parameterName === 'speed'
			).keyframes[0];
		});
		expect(keyframe).toMatchObject({ time: 0, value: 0.5 });

		await speedParameter
			.getByTitle('Remove keyframe (current time has keyframe)')
			.click();
		await expect(firstTrack.locator('.automation-lane-row')).toHaveCount(0);
		await expect(
			parameterPanel.getByText('No automation curves')
		).toBeVisible();
	});

	test('deletes the selected timeline clip with the Delete key', async ({
		page
	}) => {
		await page.locator('.shader-card', { hasText: 'Plasma' }).first().click();

		const firstTrack = page.locator('[data-track-id]').first();
		const clip = firstTrack.locator('.timeline-clip');
		await clip.click();
		await expect(clip).toHaveClass(/selected/);
		await expect(page.locator('.parameter-panel')).toContainText('Plasma.fs');

		await page.keyboard.press('Delete');

		await expect(firstTrack.locator('.timeline-clip')).toHaveCount(0);
		await expect(page.locator('.parameter-panel')).toContainText(
			'Select a clip to view parameters'
		);
	});

	test('proportionally resizes clip automation while Alt-dragging', async ({
		page
	}) => {
		await page.evaluate(() => {
			const actions = (window as any).__timelineActions;
			const state = (window as any).__timelineStore.get();
			actions.addClip(state.tracks[0].id, 'Plasma.fs', 0, 5);
			const clip = (window as any).__timelineStore.get().tracks[0].clips[0];
			actions.addKeyframe(clip.id, 'speed', 1, 0.25);
			actions.addKeyframe(clip.id, 'speed', 3, 0.75);
		});

		const clip = page.locator('.timeline-clip').first();
		await clip.click();
		const rightHandle = clip.locator('.resize-handle.right');
		const handleBox = await rightHandle.boundingBox();
		const timelineOverlayBox = await page
			.locator('.timeline-content-overlay')
			.boundingBox();
		expect(handleBox).not.toBeNull();
		expect(timelineOverlayBox).not.toBeNull();

		await page.keyboard.down('Alt');
		await page.mouse.move(
			handleBox!.x + handleBox!.width / 2,
			handleBox!.y + handleBox!.height / 2
		);
		await page.mouse.down();
		await page.mouse.move(
			timelineOverlayBox!.x + 7 * 50,
			handleBox!.y + handleBox!.height / 2
		);
		await expect(page.getByText('PROPORTIONAL MODE (Alt)')).toBeVisible();
		await page.mouse.up();
		await page.keyboard.up('Alt');

		const resizedClip = await page.evaluate(() => {
			return (window as any).__timelineStore.get().tracks[0].clips[0];
		});
		expect(resizedClip.duration).toBe(7);
		const keyframes = resizedClip.automation[0].keyframes;
		expect(keyframes).toHaveLength(2);
		expect(keyframes[0]).toMatchObject({ value: 0.25 });
		expect(keyframes[0].time).toBeCloseTo(1.4, 5);
		expect(keyframes[1]).toMatchObject({ value: 0.75 });
		expect(keyframes[1].time).toBeCloseTo(4.2, 5);
	});
});
