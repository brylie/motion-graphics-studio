import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
	{
		ignores: [
			'.claude/**',
			'.codex/**',
			'.svelte-kit/**',
			'coverage/**',
			'node_modules/**',
			'playwright-report/**',
			'storybook-static/**',
			'test-results/**'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } }
	},

	{
		files: ['**/*.svelte'],
		languageOptions: { parserOptions: { parser: tseslint.parser } }
	},
	eslintConfigPrettier,
	...svelte.configs['flat/prettier'],
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'svelte/prefer-svelte-reactivity': 'off',
			'svelte/require-each-key': 'off'
		}
	},

	{
		files: ['**/*.svelte'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'no-unused-vars': 'off'
		}
	}
];
