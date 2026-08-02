import { describe, expect, it } from 'vitest';
import { applyDropEffect } from './dragDrop';

describe('applyDropEffect', () => {
	it.each([
		['shader', 'copy'],
		['clip', 'move'],
		[null, 'none']
	] as const)('sets %s drags to %s', (dragType, expectedDropEffect) => {
		const dataTransfer = { dropEffect: 'none' } as DataTransfer;

		applyDropEffect(dataTransfer, dragType);

		expect(dataTransfer.dropEffect).toBe(expectedDropEffect);
	});

	it('ignores missing data transfer', () => {
		expect(() => applyDropEffect(null, 'shader')).not.toThrow();
	});
});
