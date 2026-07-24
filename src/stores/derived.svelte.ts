import { dataStore, DAY_MS } from '$stores/data.svelte';
import { bookmarkStore } from '$stores/ui.svelte';
import type {
	GroupedHistory,
	HistoryDistribution,
	HistoryStats,
	SortMode,
	TimelineFilter
} from '$types';
import { computeStatsFromGroups, computeDistributionFromGroups } from '$history/stats';
import Fuse from 'fuse.js';

/**
 * Pure timeline-window resolver. Returns [from, to] in epoch ms, or null
 * if the timeline is "all". For "custom", uses the filter's custom range.
 */
export function resolveTimeline(
	timeline: TimelineFilter,
	now: number,
	customFrom: number | null,
	customTo: number | null
): [number, number] | null {
	const startOfDay = (ts: number) => ts - (ts % DAY_MS);
	switch (timeline) {
		case 'today':
			return [startOfDay(now), now];
		case 'yesterday':
			return [startOfDay(now) - DAY_MS, startOfDay(now)];
		case '7d':
			return [now - 7 * DAY_MS, now];
		case '30d':
			return [now - 30 * DAY_MS, now];
		case 'custom':
			if (customFrom == null && customTo == null) return null;
			return [customFrom ?? -Infinity, customTo ?? Infinity];
		case 'all':
		default:
			return null;
	}
}

/** Sort comparator factory — avoids re-creating closures per render. */
const SORTERS: Record<SortMode, (a: GroupedHistory, b: GroupedHistory) => number> = {
	az: (a, b) => a.domain.localeCompare(b.domain),
	za: (a, b) => b.domain.localeCompare(a.domain),
	'visits-high': (a, b) => b.totalVisits - a.totalVisits,
	'visits-low': (a, b) => a.totalVisits - b.totalVisits,
	recent: (a, b) => b.lastSeen - a.lastSeen,
	oldest: (a, b) => a.firstSeen - b.firstSeen
};

/**
 * Build a Fuse index over the full group list.
 *
 * `minMatchCharLength: 1` lets a single typed character filter results (spec
 * requirement). `threshold: 0.4` allows partial/fuzzy matches like "face" →
 * "facebook". `ignoreLocation` means matches anywhere in the field count.
 */
function buildFuse(groups: GroupedHistory[]): Fuse<GroupedHistory> {
	return new Fuse(groups, {
		keys: ['domain', 'subdomain', 'titles', 'urls.url', 'urls.title'],
		threshold: 0.4,
		ignoreLocation: true,
		minMatchCharLength: 1,
		includeScore: false,
		useExtendedSearch: false
	});
}

class DerivedStore {
	/**
	 * Fuse index cache.
	 *
	 * IMPORTANT: these are PLAIN fields, NOT `$state`. The `filtered` getter is
	 * consumed inside a `$derived(...)` in the page; if it mutated `$state`
	 * Svelte would throw `state_unsafe_mutation` and silently break reactivity
	 * for every downstream consumer (search, sort, filters all stop updating).
	 * Plain fields + identity comparison let us memoize the index without
	 * participating in the reactive graph.
	 */
	private fuse: Fuse<GroupedHistory> | null = null;
	private indexedGroups: GroupedHistory[] | null = null;

	/**
	 * Lazily build (or reuse) the Fuse index for the current dataset.
	 * Called from `filtered`, which runs inside `$derived` — must NOT touch
	 * any `$state`, hence the plain fields above.
	 */
	private getFuse(groups: GroupedHistory[]): Fuse<GroupedHistory> {
		if (this.indexedGroups !== groups) {
			this.fuse = buildFuse(groups);
			this.indexedGroups = groups;
		}
		return this.fuse!;
	}

	/**
	 * The filtered + sorted list of groups shown in the grid.
	 *
	 * Pipeline (per spec): normalize → dedupe → search → filters → sort.
	 * Search and the categorical/numeric filters are all predicates, so their
	 * order doesn't change the result set — but Fuse must run on a list, so we
	 * apply cheap filters first, then fuzzy search, then sort last.
	 *
	 * This getter reads `$state` (`dataStore.data`, `dataStore.filters`,
	 * `bookmarkStore.domains`) but never mutates it — safe inside `$derived`.
	 */
	get filtered(): GroupedHistory[] {
		const data = dataStore.data;
		if (!data) return [];
		const f = dataStore.filters;

		let result: GroupedHistory[] = data.groups;

		// 1. Timeline — narrows by first/last seen overlap.
		const window = resolveTimeline(f.timeline, Date.now(), f.customFrom, f.customTo);
		if (window) {
			const [from, to] = window;
			result = result.filter((g) => g.lastSeen >= from && g.firstSeen <= to);
		}

		// 2. Numeric filters.
		if (f.minVisits != null) {
			result = result.filter((g) => g.totalVisits >= f.minVisits!);
		}
		if (f.minTyped != null) {
			result = result.filter(
				(g) => g.transitions.includes('typed') || g.totalVisits >= f.minTyped!
			);
		}

		// 3. Categorical filters.
		if (f.transition) {
			result = result.filter((g) => g.transitions.includes(f.transition!));
		}
		if (f.protocol) {
			result = result.filter((g) => (f.protocol === 'https' ? g.hasHttps : g.hasHttp));
		}
		if (f.tld) {
			result = result.filter((g) => g.domain.endsWith('.' + f.tld!));
		}

		// 4. Bookmarks filter.
		if (f.bookmarkedOnly) {
			result = result.filter((g) => bookmarkStore.has(g.domain));
		}

		// 5. Fuzzy search — case-insensitive, trimmed, whitespace-tolerant.
		//    Empty/whitespace-only query keeps the current filtered set.
		const q = f.search.trim();
		if (q.length > 0) {
			const fuse = this.getFuse(data.groups);
			const hits = fuse.search(q);
			// Intersect hits with the already-filtered set (Fuse searched the
			// full dataset, so we keep only items that also pass the filters).
			const allowed = new Set(result);
			result = hits.map((h) => h.item).filter((g) => allowed.has(g));
		}

		// 6. Sort — always last, on the fully filtered set. Never mutates
		//    the original; `[...result]` produces a fresh array.
		const sorter = SORTERS[f.sort];
		return [...result].sort(sorter);
	}

	/** Total count before filtering — for the "showing X of Y" label. */
	get totalCount(): number {
		return dataStore.data?.groups.length ?? 0;
	}

	get filteredCount(): number {
		return this.filtered.length;
	}

	/**
	 * Stats recomputed from the FILTERED groups — the Dashboard must reflect
	 * what the user is currently viewing, not the original dataset.
	 */
	get filteredStats(): HistoryStats | null {
		const groups = this.filtered;
		if (groups.length === 0) return null;
		return computeStatsFromGroups(groups);
	}

	/**
	 * Distribution (chart data) recomputed from the FILTERED groups.
	 */
	get filteredDistribution(): HistoryDistribution | null {
		const groups = this.filtered;
		if (groups.length === 0) return null;
		return computeDistributionFromGroups(groups);
	}

	/** Distinct values for filter dropdowns, derived from the full dataset. */
	get facets() {
		const data = dataStore.data;
		if (!data) {
			return { transitions: [] as string[], protocols: [] as string[], tlds: [] as string[] };
		}
		const transitions = new Set<string>();
		const protocols = new Set<string>();
		const tlds = new Set<string>();
		for (const g of data.groups) {
			for (const t of g.transitions) transitions.add(t);
			if (g.hasHttps) protocols.add('https');
			if (g.hasHttp) protocols.add('http');
			if (g.domain.includes('.')) {
				const parts = g.domain.split('.');
				tlds.add(parts[parts.length - 1]);
			}
		}
		return {
			transitions: [...transitions].sort(),
			protocols: [...protocols].sort(),
			tlds: [...tlds].sort()
		};
	}
}

export const derivedStore = new DerivedStore();
