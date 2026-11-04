import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
	// Global ignores
	{
		ignores: [
			'**/node_modules/**',
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			'coverage/**',
			'playwright-report/**',
			'test-results/**',
			'.vs/**',
			'Examples/**',
			'static/**',
			'**/*.min.js'
		]
	},

	// JavaScript and TypeScript
	{
		files: ['**/*.{js,cjs,mjs,ts,cts,mts}'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...js.configs.recommended.rules,
			...tsPlugin.configs.recommended.rules,

			'no-undef': 'off',
			'no-unused-vars': 'off',

			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},

	// Svelte 5 recommended rules
	...svelte.configs.recommended,

	// TypeScript inside Svelte components
	{
		files: ['**/*.svelte'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			},
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.svelte']
			}
		}
	},

	// Prettier compatibility
	...svelte.configs.prettier,
	prettier
];
