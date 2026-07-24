<script lang="ts">
	import { Heart } from 'lucide-svelte';
</script>

<footer class="mt-16 border-t-[3px] border-ink bg-surface">
	<div
		class="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6"
	>
		<p class="text-xs font-bold uppercase tracking-wider text-ink-soft">
			Browser History Analyzer · Runs entirely in your browser
		</p>
		<p class="flex items-center gap-1.5 text-xs font-bold">
			Built with
			<Heart size={12} strokeWidth={3} class="inline text-accent-5" fill="currentColor" />
			using SvelteKit + Tailwind
		</p>
	</div>
</footer>
