<script lang="ts">
	import type { GroupedHistory } from '$types';
	import { scale } from '$utils/chart';
	import { formatCompact } from '$utils/format';
	import { utcDayKey } from '$utils/date';

	let {
		groups,
		emptyLabel = 'No activity'
	}: {
		groups: GroupedHistory[];
		emptyLabel?: string;
	} = $props();

	const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const HOURS = 24;
	const DAY_MS = 86_400_000;

	/**
	 * Build a 7×24 matrix of visit counts (UTC) from the aggregated groups.
	 *
	 * Groups don't store per-visit timestamps, so we distribute each group's
	 * totalVisits across the days it spans (even split) and attribute the
	 * hour-of-day to the group's lastSeen hour. This keeps the heatmap
	 * meaningful and — critically — consistent with the filtered dataset
	 * (it reacts to filters because it reads the filtered groups).
	 */
	const matrix = $derived.by(() => {
		const m: number[][] = Array.from({ length: 7 }, () => new Array(HOURS).fill(0));
		for (const g of groups) {
			const start = new Date(g.firstSeen);
			const end = new Date(g.lastSeen);
			const daySpan = Math.max(1, Math.round((g.lastSeen - g.firstSeen) / DAY_MS) + 1);
			const perDay = g.totalVisits / daySpan;
			let cursor = g.firstSeen;
			for (let d = 0; d < daySpan; d++) {
				const c = new Date(cursor);
				m[c.getUTCDay()][c.getUTCHours()] += perDay;
				cursor += DAY_MS;
				if (cursor > g.lastSeen) break;
			}
			// Ensure the end day also gets credit.
			m[end.getUTCDay()][end.getUTCHours()] += perDay * 0.5;
		}
		return m;
	});

	const max = $derived.by(() => {
		let m = 0;
		for (const row of matrix) for (const v of row) if (v > m) m = v;
		return Math.max(1, m);
	});

	const cellSize = 16;
	const gap = 2;
	const labelW = 28;
	const labelH = 14;
	const gridW = labelW + HOURS * (cellSize + gap);
	const gridH = labelH + 7 * (cellSize + gap);

	function cellColor(v: number): string {
		if (v === 0) return 'var(--color-surface-alt)';
		const t = scale(v, [0, max], [0.15, 1]);
		return `color-mix(in srgb, var(--color-accent) ${Math.round(t * 100)}%, var(--color-surface))`;
	}
</script>

{#if groups.length === 0}
	<div class="grid place-items-center text-xs font-bold text-ink-soft" style="height:160px">
		{emptyLabel}
	</div>
{:else}
	<svg viewBox="0 0 {gridW} {gridH}" class="w-full" style="max-height:220px" role="img" aria-label="Activity heatmap by day and hour">
		<!-- Hour labels (top) -->
		{#each Array(HOURS) as _, h}
			{#if h % 3 === 0}
				<text
					x={labelW + h * (cellSize + gap) + cellSize / 2}
					y={labelH - 3}
					font-size="8"
					font-family="monospace"
					font-weight="700"
					text-anchor="middle"
					fill="var(--color-ink-soft)"
				>{String(h).padStart(2, '0')}</text>
			{/if}
		{/each}

		<!-- Day labels + cells -->
		{#each matrix as row, day}
			<text
				x={labelW - 4}
				y={labelH + day * (cellSize + gap) + cellSize / 2 + 3}
				font-size="9"
				font-family="monospace"
				font-weight="800"
				text-anchor="end"
				fill="var(--color-ink-soft)"
			>{DAYS[day]}</text>
			{#each row as v, hour}
				<rect
					x={labelW + hour * (cellSize + gap)}
					y={labelH + day * (cellSize + gap)}
					width={cellSize}
					height={cellSize}
					fill={cellColor(v)}
					stroke="var(--color-border)"
					stroke-width="0.5"
				>
					<title>{DAYS[day]} {String(hour).padStart(2, '0')}:00 — {formatCompact(v)} visits</title>
				</rect>
			{/each}
		{/each}
	</svg>
{/if}
