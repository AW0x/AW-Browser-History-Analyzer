<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { dataStore } from '$stores/data.svelte';
	import { formatNumber } from '$utils/format';

	let { label = 'Loading…' }: { label?: string } = $props();

	const pct = $derived(Math.round(dataStore.progress * 100));
</script>

<div class="flex min-h-[50vh] items-center justify-center px-4 py-12">
	<div class="nb-card w-full max-w-md p-8 text-center">
		<Loader2 size={48} strokeWidth={2.5} class="mx-auto mb-4 animate-spin text-accent" />
		<h2 class="mb-1 text-xl font-black tracking-tight">{label}</h2>
		<p class="mb-5 text-sm font-medium text-ink-soft">Normalizing &amp; grouping your history…</p>

		<div
			class="h-5 w-full border-[3px] border-ink bg-surface-alt p-0.5"
			role="progressbar"
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Import progress"
		>
			<div
				class="h-full bg-accent transition-[width] duration-150 ease-out"
				style="width: {pct}%"
			></div>
		</div>
		<p class="mt-2 font-mono text-xs font-bold">{pct}%</p>
	</div>
</div>
