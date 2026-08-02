import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	resolve: {
		dedupe: ['aria-query']
	},
	optimizeDeps: {
		include: ['@testing-library/dom', 'aria-query']
	},

	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: true,

				test: {
					name: 'unit',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/lib/server/**']
				}
			},

			{
				extends: true,

				test: {
					name: 'component',

					browser: {
						enabled: true,
						provider: playwright({ launchOptions: { channel: 'chrome' } }),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: true,
				plugins: [
					storybookTest({ configDir: path.join(dirname, '.storybook') })
				],

				test: {
					name: 'storybook',

					browser: {
						enabled: true,
						provider: playwright({ launchOptions: { channel: 'chrome' } }),
						instances: [{ browser: 'chromium', headless: true }]
					}
				}
			}
		]
	}
});
