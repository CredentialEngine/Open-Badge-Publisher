import adapterNode from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import preprocess from 'svelte-preprocess';
import { defineConfig } from 'vite';

// SvelteKit 3 reads its configuration from the Vite plugin, not svelte.config.js.
export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapterNode(),
			preprocess: preprocess({ postcss: true }),
			// Keep SvelteKit's production form-origin CSRF enforcement in place.
			// JSON proxy handlers still need API-level authentication and security review.
			csrf: { trustedOrigins: [] }
		})
	],
	build: { minify: false }
});
