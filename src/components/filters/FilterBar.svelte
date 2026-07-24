<script lang="ts">
	import SearchBox from './SearchBox.svelte';
	import { dataStore } from '$stores/data.svelte';
	import { derivedStore } from '$stores/derived.svelte';
	import { clsx } from '$lib/clsx';
	import type { SortMode, TimelineFilter } from '$types';
	import { SlidersHorizontal, ArrowDownUp, Calendar, Eye, Bookmark } from 'lucide-svelte';

	let showAdvanced = $state(false);

	const SORT_OPTIONS: { value: SortMode; label: string }[] = [
		{ value: 'visits-high', label: 'Most visits' },
		{ value: 'visits-low', label: 'Fewest visits' },
		{ value: 'recent', label: 'Most recent' },
		{ value: 'oldest', label: 'Oldest first' },
		{ value: 'az', label: 'A → Z' },
		{ value: 'za', label: 'Z → A' }
	];

	const TIMELINE_OPTIONS: { value: TimelineFilter; label: string }[] = [
		{ value: 'all', label: 'All time' },
		{ value: 'today', label: 'Today' },
		{ value: 'yesterday', label: 'Yesterday' },
		{ value: '7d', label: 'Last 7 days' },
		{ value: '30d', label: 'Last 30 days' },
		{ value: 'custom', label: 'Custom…' }
	];

	const facets = $derived(derivedStore.facets);
	const f = $derived(dataStore.filters);

	function setSort(e: Event) {
		const v = (e.target as HTMLSelectElement).value as SortMode;
		dataStore.setSort(v);
	}

	function setTimeline(e: Event) {
		const v = (e.target as HTMLSelectElement).value as TimelineFilter;
		dataStore.setTimeline(v);
	}

	function setCustomDate(kind: 'from' | 'to', value: string) {
		const ts = value ? new Date(value).getTime() : null;
		dataStore.updateFilters(kind === 'from' ? { customFrom: ts } : { customTo: ts });
	}

	function setFacet(key: 'transition' | 'protocol' | 'tld', value: string) {
		dataStore.updateFilters({ [key]: value || null } as Partial<typeof f>);
	}

	function setMinVisits(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		dataStore.updateFilters({ minVisits: v ? Number(v) : null });
	}

	function toggleBookmarked() {
		dataStore.updateFilters({ bookmarkedOnly: !f.bookmarkedOnly });
	}

	function resetFilters() {
		dataStore.filters = {
			search: '',
			sort: 'visits-high',
			timeline: 'all',
			customFrom: null,
			customTo: null,
			minVisits: null,
			minTyped: null,
			transition: null,
			protocol: null,
			tld: null,
			bookmarkedOnly: false
		};
	}

	const hasActiveFilters = $derived(
		f.timeline !== 'all' ||
			f.minVisits != null ||
			f.transition != null ||
			f.protocol != null ||
			f.tld != null ||
			f.bookmarkedOnly ||
			f.customFrom != null ||
			f.customTo != null
	);
</script>

<div class="sticky top-[73px] z-30 border-y-[3px] border-ink bg-paper/95 backdrop-blur-sm">
	<div class="mx-auto max-w-7xl px-4 py-3 sm:px-6">
		<!-- Row 1: search + sort + advanced toggle -->
		<div class="flex flex-wrap items-center gap-2 sm:gap-3">
			<SearchBox />

			<label class="flex items-center gap-1.5">
				<span class="sr-only">Sort by</span>
				<div class="relative">
					<span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft">
						<ArrowDownUp size={14} strokeWidth={2.75} />
					</span>
					<select
						class="nb-input cursor-pointer py-2 pl-8 pr-7 text-xs font-bold"
						value={f.sort}
						onchange={setSort}
						aria-label="Sort order"
					>
						{#each SORT_OPTIONS as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
			</label>

			<button
				type="button"
				class={clsx(
					'nb-btn px-3 py-2 text-xs',
					showAdvanced ? 'bg-accent text-paper' : 'bg-surface'
				)}
				onclick={() => (showAdvanced = !showAdvanced)}
				aria-expanded={showAdvanced}
				aria-controls="advanced-filters"
			>
				<SlidersHorizontal size={14} strokeWidth={2.75} />
				Filters
				{#if hasActiveFilters}
					<span class="grid size-4 place-items-center border-[2px] border-ink bg-accent-3 text-[9px] font-black">
						!
					</span>
				{/if}
			</button>
		</div>

		<!-- Row 2: advanced filters (collapsible) -->
		{#if showAdvanced}
			<div
				id="advanced-filters"
				class="mt-3 grid grid-cols-2 gap-2 border-t-[2px] border-ink pt-3 sm:grid-cols-3 lg:grid-cols-6"
			>
				<!-- Timeline -->
				<label class="flex flex-col gap-1">
					<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">Timeline</span>
					<div class="relative">
						<span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft">
							<Calendar size={14} strokeWidth={2.75} />
						</span>
						<select
							class="nb-input cursor-pointer py-2 pl-8 pr-7 text-xs font-bold"
							value={f.timeline}
							onchange={setTimeline}
						>
							{#each TIMELINE_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				</label>

				<!-- Custom range (only when custom selected) -->
				{#if f.timeline === 'custom'}
					<label class="flex flex-col gap-1">
						<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">From</span>
						<input
							type="date"
							class="nb-input cursor-pointer py-2 text-xs font-bold"
							value={f.customFrom ? new Date(f.customFrom).toISOString().slice(0, 10) : ''}
							oninput={(e) => setCustomDate('from', (e.target as HTMLInputElement).value)}
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">To</span>
						<input
							type="date"
							class="nb-input cursor-pointer py-2 text-xs font-bold"
							value={f.customTo ? new Date(f.customTo).toISOString().slice(0, 10) : ''}
							oninput={(e) => setCustomDate('to', (e.target as HTMLInputElement).value)}
						/>
					</label>
				{/if}

				<!-- Min visits -->
				<label class="flex flex-col gap-1">
					<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">Min visits</span>
					<input
						type="number"
						min="0"
						placeholder="0"
						class="nb-input py-2 text-xs font-bold"
						value={f.minVisits ?? ''}
						oninput={setMinVisits}
					/>
				</label>

				<!-- Transition -->
				<label class="flex flex-col gap-1">
					<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">Transition</span>
					<select
						class="nb-input cursor-pointer py-2 text-xs font-bold"
						value={f.transition ?? ''}
						onchange={(e) => setFacet('transition', (e.target as HTMLSelectElement).value)}
					>
						<option value="">Any</option>
						{#each facets.transitions as t}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</label>

				<!-- Protocol -->
				<label class="flex flex-col gap-1">
					<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">Protocol</span>
					<select
						class="nb-input cursor-pointer py-2 text-xs font-bold"
						value={f.protocol ?? ''}
						onchange={(e) => setFacet('protocol', (e.target as HTMLSelectElement).value)}
					>
						<option value="">Any</option>
						{#each facets.protocols as p}
							<option value={p}>{p}</option>
						{/each}
					</select>
				</label>

				<!-- TLD -->
				<label class="flex flex-col gap-1">
					<span class="text-[10px] font-black uppercase tracking-wider text-ink-soft">TLD</span>
					<select
						class="nb-input cursor-pointer py-2 text-xs font-bold"
						value={f.tld ?? ''}
						onchange={(e) => setFacet('tld', (e.target as HTMLSelectElement).value)}
					>
						<option value="">Any</option>
						{#each facets.tlds as t}
							<option value={t}>.{t}</option>
						{/each}
					</select>
				</label>
			</div>

			<!-- Bookmarks toggle + reset -->
			<div class="mt-2 flex flex-wrap items-center gap-2">
				<button
					type="button"
					class={clsx('nb-btn px-3 py-1.5 text-xs', f.bookmarkedOnly ? 'bg-accent-2 text-ink' : 'bg-surface')}
					onclick={toggleBookmarked}
					aria-pressed={f.bookmarkedOnly}
				>
					<Bookmark size={14} strokeWidth={2.75} fill={f.bookmarkedOnly ? 'currentColor' : 'none'} />
					Bookmarked only
				</button>
				{#if hasActiveFilters}
					<button
						type="button"
						class="nb-btn bg-accent-5 px-3 py-1.5 text-xs text-paper"
						onclick={resetFilters}
					>
						<Eye size={14} strokeWidth={2.75} />
						Reset filters
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
