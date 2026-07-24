<script lang="ts">
	import type { Snippet } from 'svelte';
	import { clsx } from '$lib/clsx';

	type Accent = 'accent' | 'accent-2' | 'accent-3' | 'accent-4' | 'accent-5' | 'accent-6';

	let {
		title,
		subtitle,
		accent = 'accent',
		actions,
		children
	}: {
		title: string;
		subtitle?: string;
		accent?: Accent;
		actions?: Snippet;
		children: Snippet;
	} = $props();

	const bar: Record<Accent, string> = {
		accent: 'bg-accent',
		'accent-2': 'bg-accent-2',
		'accent-3': 'bg-accent-3',
		'accent-4': 'bg-accent-4',
		'accent-5': 'bg-accent-5',
		'accent-6': 'bg-accent-6'
	};
</script>

<section class="nb-card flex flex-col overflow-hidden">
	<header class={clsx('flex items-center justify-between gap-2 border-b-[3px] border-ink px-4 py-3', bar[accent])}>
		<div class="min-w-0">
			<h3 class="truncate text-sm font-black uppercase tracking-wider text-ink">{title}</h3>
			{#if subtitle}
				<p class="truncate text-[11px] font-bold text-ink/70">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="shrink-0">
				{@render actions()}
			</div>
		{/if}
	</header>
	<div class="flex-1 p-3">
		{@render children()}
	</div>
</section>
