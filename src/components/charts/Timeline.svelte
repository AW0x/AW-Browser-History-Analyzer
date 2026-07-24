<script lang="ts">
	import type { TimeBucket } from '$types';
	import { scale } from '$utils/chart';
	import { formatCompact } from '$utils/format';
	import { dayLabel } from '$utils/date';

	let {
		data,
		height = 80,
		emptyLabel = 'No timeline data'
	}: {
		data: TimeBucket[];
		height?: number;
		emptyLabel?: string;
	} = $props();

	const W = 600;
	const H = $derived(height);
	const BAR_GAP = 1;

	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const barW = $derived(data.length > 0 ? (W - data.length * BAR_GAP) / Math.max(1, data.length) : 1);
</script>

{#if data.length === 0}
	<div class="grid place-items-center text-xs font-bold text-ink-soft" style="height:{H}px">
		{emptyLabel}
	</div>
{:else}
	<svg viewBox="0 0 {W} {H}" class="w-full" style="height:{H}px" role="img" aria-label="Visit timeline">
		<!-- Baseline -->
		<line x1="0" y1={H - 1} x2={W} y2={H - 1} stroke="var(--color-border)" stroke-width="1" />

		{#each data as d, i}
			{@const h = scale(d.value, [0, max], [0, H - 4])}
			<rect
				x={i * (barW + BAR_GAP)}
				y={H - h}
				width={Math.max(0.5, barW)}
				height={h}
				fill="var(--color-accent)"
				stroke="var(--color-border)"
				stroke-width="0.5"
			>
				<title>{dayLabel(d.label)}: {formatCompact(d.value)} visits</title>
			</rect>
		{/each}

		<!-- First/last labels -->
		{#if data.length > 0}
			<text x="2" y="10" font-size="8" font-family="monospace" font-weight="700" fill="var(--color-ink-soft)">
				{dayLabel(data[0].label)}
			</text>
			<text x={W - 2} y="10" font-size="8" font-family="monospace" font-weight="700" text-anchor="end" fill="var(--color-ink-soft)">
				{dayLabel(data[data.length - 1].label)}
			</text>
		{/if}
	</svg>
{/if}
