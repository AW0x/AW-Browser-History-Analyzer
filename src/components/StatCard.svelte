<script lang="ts">
	import type { Snippet } from 'svelte';
	import { clsx } from '$lib/clsx';

	type Accent = 'accent' | 'accent-2' | 'accent-3' | 'accent-4' | 'accent-5' | 'accent-6';

	let {
		label,
		value,
		subtitle,
		accent = 'accent',
		icon
	}: {
		label: string;
		value: string | number;
		subtitle?: string;
		accent?: Accent;
		icon?: Snippet;
	} = $props();

	const bgClass: Record<Accent, string> = {
		accent: 'bg-accent text-paper',
		'accent-2': 'bg-accent-2 text-ink',
		'accent-3': 'bg-accent-3 text-ink',
		'accent-4': 'bg-accent-4 text-paper',
		'accent-5': 'bg-accent-5 text-paper',
		'accent-6': 'bg-accent-6 text-paper'
	};
</script>

<div class="nb-card nb-card-hover flex flex-col gap-1 p-4 sm:p-5">
	<div class="flex items-start justify-between gap-2">
		<span class="text-[11px] font-black uppercase tracking-widest text-ink-soft">{label}</span>
		{#if icon}
			<span class={clsx('grid size-7 shrink-0 place-items-center border-[2px] border-ink', bgClass[accent])}>
				{@render icon()}
			</span>
		{/if}
	</div>
	<span class="mt-1 font-mono text-2xl font-black leading-none tracking-tight sm:text-3xl">{value}</span>
	{#if subtitle}
		<span class="truncate text-xs font-semibold text-ink-soft" title={subtitle}>{subtitle}</span>
	{/if}
</div>
