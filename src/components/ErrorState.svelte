<script lang="ts">
	import { AlertTriangle, RotateCcw } from 'lucide-svelte';
	import { dataStore } from '$stores/data.svelte';

	let { onRetry }: { onRetry?: () => void } = $props();
</script>

<div class="flex min-h-[50vh] items-center justify-center px-4 py-12">
	<div class="nb-card max-w-lg border-accent-5 p-8 text-center">
		<div
			class="mx-auto mb-5 grid size-16 place-items-center border-[3px] border-ink bg-accent-5 shadow-brutal"
		>
			<AlertTriangle size={32} strokeWidth={2.5} class="text-paper" />
		</div>
		<h2 class="mb-2 text-xl font-black tracking-tight sm:text-2xl">Import failed</h2>
		{#if dataStore.error}
			<p class="mb-5 rounded-none border-[2px] border-ink bg-surface-alt p-3 text-left font-mono text-xs">
				{dataStore.error}
			</p>
		{/if}
		{#if onRetry}
			<button type="button" class="nb-btn bg-accent px-4 py-2 text-sm text-paper" onclick={onRetry}>
				<RotateCcw size={16} strokeWidth={2.75} />
				Try again
			</button>
		{/if}
	</div>
</div>
