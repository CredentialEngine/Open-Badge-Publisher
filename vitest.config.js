// SvelteKit 3 validates required public environment variables while initializing
// its Vite plugin. Supply harmless defaults for unit tests only, without
// weakening the production environment schema in src/env.ts.
process.env.PUBLIC_BASEURL ||= 'http://localhost:5173';
process.env.PUBLIC_PUBLISHER_API_BASEURL ||= 'http://localhost:5173/publisher';
process.env.PUBLIC_UI_API_BASEURL ||= '/publisher';

// Import after setting the test defaults: static imports run before this file's
// statements, which could initialize the SvelteKit plugin too early.
const { default: viteConfig } = await import('./vite.config.js');

export default {
	...viteConfig,
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
};
