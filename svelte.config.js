import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// SPA mode: pre-render an index page and fall back to it for all routes.
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		// The spec organizes code into top-level src/ directories. Expose them as
		// path aliases so imports stay short and stable across the codebase.
		alias: {
			$components: 'src/components',
			$layout: 'src/components/layout',
			$history: 'src/history',
			$dashboard: 'src/dashboard',
			$cards: 'src/components/cards',
			$charts: 'src/charts',
			$modal: 'src/components/modal',
			$filters: 'src/components/filters',
			$stores: 'src/stores',
			$utils: 'src/utils',
			$types: 'src/types'
		}
	},
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	}
};
