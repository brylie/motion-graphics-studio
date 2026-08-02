import { defineConfig } from '@playwright/test';

export default defineConfig({
	reporter: process.env.CI ? 'html' : 'list',
	use: {
		channel: 'chrome'
	},
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: { VITE_E2E_TEST: 'true' }
	},
	testDir: 'e2e'
});
