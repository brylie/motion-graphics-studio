import { defineConfig } from '@playwright/test';

export default defineConfig({
	use: {
		channel: 'chrome'
	},
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e'
});
