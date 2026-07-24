/**
 * Aggregate statistics computed once from the full dataset.
 * Every field is precomputed so the dashboard never recomputes on filter changes.
 */
export interface HistoryStats {
	totalHistory: number;
	uniqueUrls: number;
	uniqueDomains: number;
	uniqueSubdomains: number;
	firstVisit: number;
	lastVisit: number;
	mostActiveDay: string | null;
	mostActiveHour: number | null;
	averageVisits: number;
	largestDomain: { domain: string; urls: number } | null;
	mostVisitedDomain: { domain: string; visits: number } | null;
	mostVisitedUrl: { url: string; title: string; visits: number } | null;
}

export interface NameCount {
	name: string;
	count: number;
}

export interface TimeBucket {
	/** ISO date string (UTC) for day buckets, hour-of-day 0-23 for hour buckets. */
	label: string;
	value: number;
}

export interface HistoryDistribution {
	topDomains: NameCount[];
	topSubdomains: NameCount[];
	topUrls: NameCount[];
	topTitles: NameCount[];
	visitsPerDay: TimeBucket[];
	visitsPerHour: TimeBucket[];
	mostCommonTransition: string | null;
	typedVsLink: { typed: number; link: number };
	httpsVsHttp: { https: number; http: number };
	tldDistribution: NameCount[];
}
