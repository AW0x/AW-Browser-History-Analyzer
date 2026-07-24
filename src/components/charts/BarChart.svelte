<script lang="ts">
	import type { NameCount } from '$types';
	import { CHART_COLORS } from '$utils/chart';
	import { formatCompact } from '$utils/format';

	let {
		data,
		horizontal = false,
		height = 200,
		emptyLabel = 'No data'
	}: {
		data: NameCount[];
		horizontal?: boolean;
		height?: number;
		emptyLabel?: string;
	} = $props();

	const max = $derived(Math.max(1, ...data.map((d) => d.count)));
</script>

{#if data.length === 0}
	<div class="grid place-items-center text-xs font-bold text-ink-soft" style="height:{height}px">
		{emptyLabel}
	</div>
{:else if horizontal}
	<ul class="flex flex-col gap-1.5">
		{#each data.slice(0, 10) as d, i}
			<li class="flex items-center gap-2">
				<span class="w-24 shrink-0 truncate text-right font-mono text-[11px] font-bold" title={d.name}>
					{d.name}
				</span>
				<div class="relative h-5 flex-1 border-[2px] border-ink bg-surface-alt">
					<div
						class="h-full border-r-[2px] border-ink transition-[width] duration-300"
						style="width:{(d.count / max) * 100}%;background:{CHART_COLORS[i % CHART_COLORS.length]}"
						role="img"
						aria-label={`${d.name}: ${d.count}`}
					></div>
				</div>
				<span class="w-12 shrink-0 text-right font-mono text-[11px] font-black">
					{formatCompact(d.count)}
				</span>
			</li>
		{/each}
	</ul>
{:else}
	<div class="flex h-full items-end gap-1" style="min-height:{height}px">
		{#each data.slice(0, 12) as d, i}
			<div class="flex flex-1 flex-col items-center gap-1">
				<span class="font-mono text-[10px] font-black">{formatCompact(d.count)}</span>
				<div class="flex w-full flex-1 items-end">
					<div
						class="w-full border-[2px] border-ink transition-[height] duration-300"
						style="height:{Math.max(2, (d.count / max) * 100)}%;background:{CHART_COLORS[i % CHART_COLORS.length]}"
						role="img"
						aria-label={`${d.name}: ${d.count} visits`}
						title={`${d.name}: ${formatCompact(d.count)}`}
					></div>
				</div>
				<span class="line-clamp-1 w-full text-center text-[9px] font-bold text-ink-soft" title={d.name}>
					{d.name.length > 12 ? d.name.slice(0, 10) + '…' : d.name}
				</span>
			</div>
		{/each}
	</div>
{/if}
