import { browser } from '$app/environment';
import type { AppData, AppStatus, FilterState, SortMode, TimelineFilter } from '$types';

const DAY_MS = 86_400_000;
const SORT_KEY = 'cha:filters:sort';

export const DEFAULT_FILTERS: FilterState = {
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

class DataStore {
	status = $state<AppStatus>('empty');
	error = $state<string | null>(null);
	data = $state<AppData | null>(null);
	filters = $state<FilterState>({ ...DEFAULT_FILTERS, ...loadPersistedSort() });

	/** Loading progress 0..1 for large files. */
	progress = $state(0);

	setLoading(): void {
		this.status = 'loading';
		this.error = null;
		this.progress = 0;
	}

	setProgress(p: number): void {
		this.progress = Math.max(0, Math.min(1, p));
	}

	setData(data: AppData): void {
		this.data = data;
		this.status = 'ready';
		this.error = null;
		this.progress = 1;
	}

	setError(message: string): void {
		this.status = 'error';
		this.error = message;
		this.progress = 0;
	}

	reset(): void {
		this.data = null;
		this.status = 'empty';
		this.error = null;
		this.progress = 0;
		this.filters = { ...DEFAULT_FILTERS, ...loadPersistedSort() };
	}

	updateFilters(patch: Partial<FilterState>): void {
		this.filters = { ...this.filters, ...patch };
	}

	setSort(sort: SortMode): void {
		this.filters.sort = sort;
		persistSort(sort);
	}

	setTimeline(timeline: TimelineFilter): void {
		this.filters.timeline = timeline;
	}
}

/** Load the persisted sort mode so the user keeps their preference across sessions. */
function loadPersistedSort(): Partial<FilterState> {
	if (!browser) return {};
	try {
		const v = localStorage.getItem(SORT_KEY);
		if (v && ['az', 'za', 'visits-high', 'visits-low', 'recent', 'oldest'].includes(v)) {
			return { sort: v as SortMode };
		}
	} catch {
		/* ignore */
	}
	return {};
}

function persistSort(sort: SortMode): void {
	if (!browser) return;
	try {
		localStorage.setItem(SORT_KEY, sort);
	} catch {
		/* ignore */
	}
}

export const dataStore = new DataStore();
export { DAY_MS };
