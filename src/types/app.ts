import type { GroupedHistory, HistoryEntry } from './history';
import type { HistoryDistribution, HistoryStats } from './stats';

/** Sort options exposed by the filter bar. */
export type SortMode = 'az' | 'za' | 'visits-high' | 'visits-low' | 'recent' | 'oldest';

export type TimelineFilter = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface FilterState {
	search: string;
	sort: SortMode;
	timeline: TimelineFilter;
	/** Inclusive lower bound (epoch ms) for custom timeline. */
	customFrom: number | null;
	/** Inclusive upper bound (epoch ms) for custom timeline. */
	customTo: number | null;
	/** Null = any. */
	minVisits: number | null;
	/** Null = any. */
	minTyped: number | null;
	transition: string | null;
	protocol: string | null;
	tld: string | null;
	/** Show only bookmarked domains. */
	bookmarkedOnly: boolean;
}

export interface AppData {
	entries: HistoryEntry[];
	groups: GroupedHistory[];
	stats: HistoryStats;
	distribution: HistoryDistribution;
}

export type Theme = 'light' | 'dark';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
}

export type AppStatus = 'empty' | 'loading' | 'ready' | 'error';
