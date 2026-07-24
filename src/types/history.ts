/**
 * Raw history item as exported by the "Quick Chrome History Export" extension.
 * https://chromewebstore.google.com/detail/quick-chrome-history-expo/acjbkgbpefalkaebgodhnbdgjbignonj
 *
 * The export shape varies slightly between versions, so every field except
 * `url` and `visitTime` is treated as optional during validation.
 */
export interface RawHistoryItem {
	id: string;
	history_id?: string;
	title?: string;
	url: string;
	/** Epoch milliseconds (Chrome `lastVisitTime`). */
	visitTime: number;
	visitCount?: number;
	typedCount?: number;
	transition?: string;
	isLocal?: boolean;
}

/**
 * Normalized URL breakdown — derived once, never recomputed.
 */
export interface NormalizedUrl {
	protocol: string;
	hostname: string;
	domain: string;
	subdomain: string;
	pathname: string;
	query: string;
	hash: string;
	tld: string;
	rootDomain: string;
}

/**
 * A single normalized history entry — one URL visit record after parsing.
 */
export interface HistoryEntry extends NormalizedUrl {
	/** Stable id from the export (falls back to `${url}|${visitTime}`). */
	id: string;
	title: string;
	url: string;
	visitTime: number;
	visitCount: number;
	typedCount: number;
	transition: string;
	isLocal: boolean;
}

/**
 * Aggregated history object — multiple visits to the same domain/subdomain
 * rolled up into one card. This is the shape the HistoryCard and export use.
 */
export interface GroupedHistory {
	domain: string;
	subdomain: string;
	firstSeen: number;
	lastSeen: number;
	totalVisits: number;
	totalUrls: number;
	/** Distinct URLs that belong to this group, deduplicated by full URL. */
	urls: GroupedUrl[];
	/** Distinct titles seen for this group. */
	titles: string[];
	/** Set of transitions observed (for stat "most common transition"). */
	transitions: string[];
	/** True if any URL is https — drives the HTTPS vs HTTP ratio. */
	hasHttps: boolean;
	/** True if any URL is http. */
	hasHttp: boolean;
}

export interface GroupedUrl {
	title: string;
	url: string;
	visitCount: number;
	firstSeen: number;
	lastSeen: number;
	protocol: string;
	pathname: string;
}
