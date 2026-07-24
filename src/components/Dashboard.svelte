<script lang="ts">
	import StatCard from '$components/StatCard.svelte';
	import { dataStore } from '$stores/data.svelte';
	import { derivedStore } from '$stores/derived.svelte';
	import { formatNumber, formatCompact } from '$utils/format';
	import { formatUtc, formatRelative, formatHour, dayLabel } from '$utils/date';
	import {
		Database,
		Link2,
		Globe,
		Network,
		CalendarClock,
		CalendarDays,
		Flame,
		Clock,
		TrendingUp,
		BarChart3,
		Trophy,
		Star
	} from 'lucide-svelte';

	// Dashboard reflects the FILTERED results (per spec), falling back to the
	// original precomputed stats when no data is loaded yet.
	const stats = $derived(derivedStore.filteredStats ?? dataStore.data?.stats);
</script>

{#if stats}
	<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
		<div class="mb-4 flex items-center gap-2">
			<span class="grid size-8 place-items-center border-[3px] border-ink bg-accent-2 shadow-brutal-sm">
				<BarChart3 size={18} strokeWidth={2.75} />
			</span>
			<h2 class="text-xl font-black tracking-tight sm:text-2xl">Dashboard</h2>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
			<StatCard
				label="Total History"
				value={formatNumber(stats.totalHistory)}
				accent="accent"
				subtitle="records loaded"
			>
				{#snippet icon()}<Database size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Unique URLs"
				value={formatNumber(stats.uniqueUrls)}
				accent="accent-4"
				subtitle="distinct addresses"
			>
				{#snippet icon()}<Link2 size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Unique Domains"
				value={formatNumber(stats.uniqueDomains)}
				accent="accent-3"
				subtitle="root domains"
			>
				{#snippet icon()}<Globe size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Unique Subdomains"
				value={formatNumber(stats.uniqueSubdomains)}
				accent="accent-6"
				subtitle="hosts"
			>
				{#snippet icon()}<Network size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="First Visit"
				value={formatRelative(stats.firstVisit)}
				accent="accent-2"
				subtitle={formatUtc(stats.firstVisit)}
			>
				{#snippet icon()}<CalendarDays size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Last Visit"
				value={formatRelative(stats.lastVisit)}
				accent="accent-5"
				subtitle={formatUtc(stats.lastVisit)}
			>
				{#snippet icon()}<CalendarClock size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Most Active Day"
				value={stats.mostActiveDay ? dayLabel(stats.mostActiveDay) : '—'}
				accent="accent"
				subtitle={stats.mostActiveDay ? formatUtc(Date.parse(stats.mostActiveDay + 'T00:00:00Z'), false) : 'no data'}
			>
				{#snippet icon()}<Flame size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Most Active Hour"
				value={stats.mostActiveHour != null ? formatHour(stats.mostActiveHour) : '—'}
				accent="accent-4"
				subtitle="UTC"
			>
				{#snippet icon()}<Clock size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Average Visits"
				value={stats.averageVisits.toFixed(1)}
				accent="accent-3"
				subtitle="per group"
			>
				{#snippet icon()}<TrendingUp size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Largest Domain"
				value={stats.largestDomain ? stats.largestDomain.domain : '—'}
				accent="accent-6"
				subtitle={stats.largestDomain ? `${formatNumber(stats.largestDomain.urls)} URLs` : 'no data'}
			>
				{#snippet icon()}<BarChart3 size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Most Visited Domain"
				value={stats.mostVisitedDomain ? stats.mostVisitedDomain.domain : '—'}
				accent="accent-5"
				subtitle={stats.mostVisitedDomain ? `${formatCompact(stats.mostVisitedDomain.visits)} visits` : 'no data'}
			>
				{#snippet icon()}<Trophy size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>

			<StatCard
				label="Most Visited URL"
				value={stats.mostVisitedUrl ? stats.mostVisitedUrl.visits : '—'}
				accent="accent-2"
				subtitle={stats.mostVisitedUrl ? stats.mostVisitedUrl.title || stats.mostVisitedUrl.url : 'no data'}
			>
				{#snippet icon()}<Star size={16} strokeWidth={2.75} />{/snippet}
			</StatCard>
		</div>
	</section>
{/if}
