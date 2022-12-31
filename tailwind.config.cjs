/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				tahiti: '#00a0ff',
				midnight: {
					DEFAULT: '#0a2942',
					500: 'hsla(207, 74%, 50%, 1)',
					600: 'hsla(207, 74%, 40%, 1)',
					700: 'hsla(207, 74%, 17%, 1)'
				},
				superaqua: '#4ee5e1',
				supermint: '#d3f8f7',
				midgray: '#8494a0',
				leather: '#996c48',
				gold: '#c2b280',
				lightgray: '#e6eaec',
				darkestgray: '#3d4443'
			},
			fontFamily: {
				sans: [
					'IBM Plex Sans',
					'ui-sans-serif',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'Arial',
					'Noto Sans',
					'sans-serif',
					'Apple Color Emoji',
					'Segoe UI Emoji',
					'Segoe UI Symbol',
					'Noto Color Emoji'
				]
			}
		}
	},
	plugins: []
};
