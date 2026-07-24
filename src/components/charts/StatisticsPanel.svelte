<script lang="ts">
	import ChartCard from './ChartCard.svelte';
	import BarChart from './BarChart.svelte';
	import LineChart from './LineChart.svelte';
	import Heatmap from './Heatmap.svelte';
	import Timeline from './Timeline.svelte';
	import { dataStore } from '$stores/data.svelte';
	import { derivedStore } from '$stores/derived.svelte';
	import { formatNumber, formatCompact } from '$utils/format';
	import { formatHour } from '$utils/date';
	import { Activity, BarChart3, Calendar, Globe, Percent, Tag } from 'lucide-svelte';

	// Charts reflect the FILTERED results (per spec), falling back to the
	// original precomputed distribution when nothing is filtered / no data.
	const dist = $derived(derivedStore.filteredDistribution ?? dataStore.data?.distribution);
	const filteredGroups = $derived(derivedStore.filtered);

	// Ratio helpers
	const typedRatio = $derived(
		dist ? (dist.typedVsLink.typed / Math.max(1, dist.typedVsLink.typed + dist.typedVsLink.link)) * 100 : 0
	);
	const httpsRatio = $derived(
		dist ? (dist.httpsVsHttp.https / Math.max(1, dist.httpsVsHttp.https + dist.httpsVsHttp.http)) * 100 : 0
	);
</script>

{#if dist}
	<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
		<div class="mb-4 flex items-center gap-2">
			<span class="grid size-8 place-items-center border-[3px] border-ink bg-accent-4 shadow-brutal-sm">
				<Activity size={18} strokeWidth={2.75} />
			</span>
			<h2 class="text-xl font-black tracking-tight sm:text-2xl">Statistics &amp; Charts</h2>
		</div>

		<!-- Ratio bars -->
		<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Typed vs Link -->
			<ChartCard title="Typed vs Link" accent="accent-4" subtitle="How did you reach pages?">
				<div class="flex flex-col gap-2 p-2">
					{#each [{ label: 'Typed', value: dist.typedVsLink.typed, color: 'var(--color-accent-4)' }, { label: 'Link', value: dist.typedVsLink.link, color: 'var(--color-accent-2)' }] as r}
						<div class="flex items-center gap-2">
							<span class="w-12 text-xs font-black">{r.label}</span>
							<div class="relative h-6 flex-1 border-[2px] border-ink bg-surface-alt">
								<div class="h-full border-r-[2px] border-ink transition-[width] duration-300" style="width:{(r.value / Math.max(1, dist.typedVsLink.typed + dist.typedVsLink.link)) * 100}%;background:{r.color}"></div>
							</div>
							<span class="w-12 text-right font-mono text-xs font-black">{formatCompact(r.value)}</span>
						</div>
					{/each}
					<p class="text-center text-xs font-bold text-ink-soft">{typedRatio.toFixed(0)}% typed</p>
				</div>
			</ChartCard>

			<!-- HTTPS vs HTTP -->
			<ChartCard title="HTTPS vs HTTP" accent="accent-3" subtitle="Connection security">
				<div class="flex flex-col gap-2 p-2">
					{#each [{ label: 'HTTPS', value: dist.httpsVsHttp.https, color: 'var(--color-accent-3)' }, { label: 'HTTP', value: dist.httpsVsHttp.http, color: 'var(--color-accent-5)' }] as r}
						<div class="flex items-center gap-2">
							<span class="w-12 text-xs font-black">{r.label}</span>
							<div class="relative h-6 flex-1 border-[2px] border-ink bg-surface-alt">
								<div class="h-full border-r-[2px] border-ink transition-[width] duration-300" style="width:{(r.value / Math.max(1, dist.httpsVsHttp.https + dist.httpsVsHttp.http)) * 100}%;background:{r.color}"></div>
							</div>
							<span class="w-12 text-right font-mono text-xs font-black">{formatCompact(r.value)}</span>
						</div>
					{/each}
					<p class="text-center text-xs font-bold text-ink-soft">{httpsRatio.toFixed(0)}% secure</p>
				</div>
			</ChartCard>
		</div>

		<!-- Main chart grid -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Visits over time -->
			<ChartCard title="Visits Over Time" accent="accent" subtitle="Daily activity (UTC)">
				<div class="w-full">
					<LineChart data={dist.visitsPerDay} height={220} />
				</div>
			</ChartCard>

			<!-- Activity heatmap -->
			<ChartCard title="Activity Heatmap" accent="accent-5" subtitle="Day × Hour (UTC)">
				<Heatmap groups={filteredGroups} />
			</ChartCard>

			<!-- Top domains -->
			<ChartCard title="Top Domains" accent="accent-2" subtitle="Most visited">
				<BarChart data={dist.topDomains} horizontal height={240} />
			</ChartCard>

			<!-- Top URLs -->
			<ChartCard title="Top URLs" accent="accent-4" subtitle="Most visited pages">
				<BarChart data={dist.topUrls} horizontal height={240} />
			</ChartCard>

			<!-- Hourly distribution -->
			<ChartCard title="Visits by Hour" accent="accent-3" subtitle="UTC hour of day">
				<LineChart data={dist.visitsPerHour} isHour height={180} />
			</ChartCard>

			<!-- TLD distribution -->
			<ChartCard title="TLD Distribution" accent="accent-6" subtitle="Top-level domains">
				<BarChart data={dist.tldDistribution} horizontal height={180} />
			</ChartCard>
		</div>

		<!-- Timeline overview -->
		<div class="mt-4">
			<ChartCard title="Visit Timeline" accent="accent-4" subtitle="Daily visit sparkline">
				<Timeline data={dist.visitsPerDay} height={90} />
			</ChartCard>
		</div>

		<!-- Transition + titles summary -->
		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<ChartCard title="Most Common Transition" accent="accent" subtitle="How navigation happens">
				<div class="p-3">
					<p class="text-center font-mono text-2xl font-black uppercase tracking-tight">
						{dist.mostCommonTransition ?? '—'}
					</p>
					<p class="mt-1 text-center text-xs font-bold text-ink-soft">
						{#if dist.mostCommonTransition}
							{formatCompact(dist.typedVsLink.typed + dist.typedVsLink.link)} total navigations
						{:else}
							no data
						{/if}
					</p>
				</div>
			</ChartCard>

			<ChartCard title="Top Titles" accent="accent-3" subtitle="Most visited page titles">
				<ul class="flex flex-col gap-1 p-2">
					{#each dist.topTitles.slice(0, 5) as t}
						<li class="flex items-center gap-2 border-b-[1px] border-ink/20 py-1 last:border-0">
							<span class="grid size-5 shrink-0 place-items-center border-[1px] border-ink bg-accent-3 text-[9px] font-black">
								{dist.topTitles.indexOf(t) + 1}
							</span>
							<span class="min-w-0 flex-1 truncate text-xs font-bold" title={t.name}>{t.name}</span>
							<span class="font-mono text-[10px] font-black">{formatCompact(t.count)}</span>
						</li>
					{/each}
				</ul>
			</ChartCard>
		</div>
	</section>
{/if}
