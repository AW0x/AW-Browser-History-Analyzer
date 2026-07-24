<script lang="ts">
	import type { TimeBucket } from '$types';
	import { scale, smoothPath } from '$utils/chart';
	import { formatCompact } from '$utils/format';
	import { dayLabel, formatHour } from '$utils/date';

	let {
		data,
		height = 200,
		isHour = false,
		emptyLabel = 'No visits recorded'
	}: {
		data: TimeBucket[];
		height?: number;
		isHour?: boolean;
		emptyLabel?: string;
	} = $props();

	const W = 600;
	const H = $derived(height);
	const PAD = { top: 12, right: 8, bottom: 22, left: 8 };

	const max = $derived(Math.max(1, ...data.map((d) => d.value)));
	const innerW = $derived(W - PAD.left - PAD.right);
	const innerH = $derived(H - PAD.top - PAD.bottom);

	const points = $derived(
		data.map((d, i) => ({
			x: PAD.left + scale(i, [0, Math.max(1, data.length - 1)], [0, innerW]),
			y: PAD.top + scale(d.value, [0, max], [innerH, 0]),
			label: isHour ? formatHour(Number(d.label)) : d.label,
			value: d.value
		}))
	);

	const linePath = $derived(smoothPath(points));
	const areaPath = $derived(
		points.length > 0
			? `${linePath} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`
			: ''
	);

	// Show ~6 labels on the x axis to avoid crowding.
	const labelEvery = $derived(Math.max(1, Math.ceil(points.length / 6)));
</script>

{#if data.length === 0}
	<div class="grid place-items-center text-xs font-bold text-ink-soft" style="height:{H}px">
		{emptyLabel}
	</div>
{:else}
	<svg viewBox="0 0 {W} {H}" class="w-full" style="height:{H}px" role="img" aria-label="Visits over time line chart">
		<!-- Grid lines -->
		{#each [0, 0.5, 1] as t}
			<line
				x1={PAD.left}
				y1={PAD.top + innerH * t}
				x2={W - PAD.right}
				y2={PAD.top + innerH * t}
				stroke="var(--color-border)"
				stroke-width="1"
				stroke-dasharray={t === 0 || t === 1 ? '0' : '3 3'}
				opacity="0.2"
			/>
		{/each}

		<!-- Area fill -->
		<path d={areaPath} fill="var(--color-accent)" opacity="0.18" />

		<!-- Line -->
		<path
			d={linePath}
			fill="none"
			stroke="var(--color-accent)"
			stroke-width="2.5"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		<!-- Points + x labels -->
		{#each points as p, i}
			{#if i % labelEvery === 0}
				<text
					x={p.x}
					y={H - 6}
					font-size="10"
					font-family="monospace"
					font-weight="700"
					text-anchor="middle"
					fill="var(--color-ink-soft)"
				>
					{isHour ? p.label : (p.label.slice(5))}
				</text>
			{/if}
			<circle
				cx={p.x}
				cy={p.y}
				r="3"
				fill="var(--color-surface)"
				stroke="var(--color-accent)"
				stroke-width="2"
			>
				<title>{isHour ? formatHour(Number(p.label)) : dayLabel(p.label)}: {formatCompact(p.value)} visits</title>
			</circle>
		{/each}
	</svg>
{/if}
