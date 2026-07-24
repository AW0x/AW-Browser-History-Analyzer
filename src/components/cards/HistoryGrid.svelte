<script lang="ts">
	import HistoryCard from './HistoryCard.svelte';
	import type { GroupedHistory } from '$types';
	import { formatNumber } from '$utils/format';
	import { Inbox } from 'lucide-svelte';

	let {
		groups,
		onViewUrls
	}: {
		groups: GroupedHistory[];
		onViewUrls?: (group: GroupedHistory) => void;
	} = $props();

	// ---- Virtualization for large lists ----
	// Estimate card height: ~230px on mobile, ~250px on desktop. We measure once.
	const ESTIMATED_ROW_HEIGHT = 270; // px, includes gap
	const COLUMNS = $derived(
		typeof window !== 'undefined'
			? window.innerWidth < 640
				? 1
				: window.innerWidth < 1024
					? 2
					: window.innerWidth < 1280
						? 3
						: 4
			: 3
	);

	let scrollTop = $state(0);
	let viewportHeight = $state(800);
	let gridEl = $state<HTMLElement>();

	const totalRows = $derived(Math.ceil(groups.length / COLUMNS));
	const totalHeight = $derived(totalRows * ESTIMATED_ROW_HEIGHT);
	const firstVisibleRow = $derived(Math.max(0, Math.floor(scrollTop / ESTIMATED_ROW_HEIGHT) - 2));
	const visibleRowCount = $derived(Math.ceil(viewportHeight / ESTIMATED_ROW_HEIGHT) + 4);
	const lastVisibleRow = $derived(Math.min(totalRows, firstVisibleRow + visibleRowCount));
	const firstVisibleIndex = $derived(firstVisibleRow * COLUMNS);
	const lastVisibleIndex = $derived(Math.min(groups.length, lastVisibleRow * COLUMNS));
	const visibleGroups = $derived(groups.slice(firstVisibleIndex, lastVisibleIndex));

	const padTop = $derived(firstVisibleRow * ESTIMATED_ROW_HEIGHT);
	const padBottom = $derived(Math.max(0, totalHeight - lastVisibleRow * ESTIMATED_ROW_HEIGHT));

	function onScroll() {
		if (gridEl) {
			scrollTop = gridEl.scrollTop;
			viewportHeight = gridEl.clientHeight;
		}
	}

	// Recompute on resize.
	$effect(() => {
		const handler = () => onScroll();
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler);
	});

	// Don't virtualize small lists — simpler & avoids scrollbar math.
	const useVirtual = $derived(groups.length > 200);
</script>

{#if groups.length === 0}
	<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
		<span class="grid size-14 place-items-center border-[3px] border-ink bg-surface-alt shadow-brutal">
			<Inbox size={28} strokeWidth={2.5} />
		</span>
		<h3 class="text-lg font-black">No matching history found</h3>
		<p class="text-sm font-medium text-ink-soft">
			No history groups match your current search and filters. Try adjusting them.
		</p>
	</div>
{:else if useVirtual}
	<!-- Virtualized list -->
	<div
		bind:this={gridEl}
		class="max-h-[70vh] overflow-y-auto"
		onscroll={onScroll}
	>
		<div style="height:{totalHeight}px;position:relative">
			<div
				class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				style="padding-top:{padTop}px;padding-bottom:{padBottom}px"
			>
				{#each visibleGroups as group (group.domain + '|' + group.subdomain)}
					<HistoryCard {group} onViewUrls={onViewUrls} />
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div
		class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	>
		{#each groups as group (group.domain + '|' + group.subdomain)}
			<HistoryCard {group} onViewUrls={onViewUrls} />
		{/each}
	</div>
{/if}

<p class="mt-4 text-center text-xs font-bold text-ink-soft">
	Showing {formatNumber(Math.min(groups.length, useVirtual ? lastVisibleIndex - firstVisibleIndex : groups.length))} of {formatNumber(groups.length)} groups
</p>
