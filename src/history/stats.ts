import type {
	GroupedHistory,
	HistoryDistribution,
	HistoryEntry,
	HistoryStats,
	NameCount,
	TimeBucket
} from '$types';
import { utcDayKey } from '$utils/date';

/**
 * Compute the headline dashboard stats. Iterates entries + groups once each.
 * Pure function — safe to memoize on the input dataset.
 */
export function computeStats(entries: HistoryEntry[], groups: GroupedHistory[]): HistoryStats {
	if (entries.length === 0) {
		return {
			totalHistory: 0,
			uniqueUrls: 0,
			uniqueDomains: 0,
			uniqueSubdomains: 0,
			firstVisit: 0,
			lastVisit: 0,
			mostActiveDay: null,
			mostActiveHour: null,
			averageVisits: 0,
			largestDomain: null,
			mostVisitedDomain: null,
			mostVisitedUrl: null
		};
	}

	// Unique sets.
	const urlSet = new Set<string>();
	const domainSet = new Set<string>();
	const subdomainSet = new Set<string>();
	const domainUrlCounts = new Map<string, number>();
	const domainVisitCounts = new Map<string, number>();
	const urlVisitCounts = new Map<string, { title: string; visits: number }>();

	// Time buckets — most active day & hour.
	const dayCounts = new Map<string, number>();
	const hourCounts = new Array<number>(24).fill(0);

	let firstVisit = Infinity;
	let lastVisit = -Infinity;
	let totalVisitCount = 0;

	for (let i = 0; i < entries.length; i++) {
		const e = entries[i];
		urlSet.add(e.url);
		domainSet.add(e.domain);
		subdomainSet.add(`${e.domain}|${e.subdomain}`);

		const visits = Math.max(1, e.visitCount || 1);
		totalVisitCount += visits;

		domainUrlCounts.set(e.domain, (domainUrlCounts.get(e.domain) ?? 0) + 1);
		domainVisitCounts.set(e.domain, (domainVisitCounts.get(e.domain) ?? 0) + visits);

		const existing = urlVisitCounts.get(e.url);
		if (existing) existing.visits += visits;
		else urlVisitCounts.set(e.url, { title: e.title, visits });

		if (e.visitTime < firstVisit) firstVisit = e.visitTime;
		if (e.visitTime > lastVisit) lastVisit = e.visitTime;

		const d = new Date(e.visitTime);
		const dayKey = utcDayKey(e.visitTime);
		dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + visits);
		hourCounts[d.getUTCHours()] += visits;
	}

	// Find maxes.
	let mostActiveDay: string | null = null;
	let mostActiveDayCount = -1;
	for (const [day, count] of dayCounts) {
		if (count > mostActiveDayCount) {
			mostActiveDayCount = count;
			mostActiveDay = day;
		}
	}

	let mostActiveHour: number | null = null;
	let mostActiveHourCount = -1;
	for (let h = 0; h < 24; h++) {
		if (hourCounts[h] > mostActiveHourCount) {
			mostActiveHourCount = hourCounts[h];
			mostActiveHour = h;
		}
	}

	// Largest domain (most distinct URLs) + most visited domain (most visits).
	let largestDomain: { domain: string; urls: number } | null = null;
	let largestUrlCount = -1;
	let mostVisitedDomain: { domain: string; visits: number } | null = null;
	let mostVisitedCount = -1;
	for (const [domain, urls] of domainUrlCounts) {
		if (urls > largestUrlCount) {
			largestUrlCount = urls;
			largestDomain = { domain, urls };
		}
	}
	for (const [domain, visits] of domainVisitCounts) {
		if (visits > mostVisitedCount) {
			mostVisitedCount = visits;
			mostVisitedDomain = { domain, visits };
		}
	}

	// Most visited single URL.
	let mostVisitedUrl: { url: string; title: string; visits: number } | null = null;
	let mostVisitedUrlCount = -1;
	for (const [url, info] of urlVisitCounts) {
		if (info.visits > mostVisitedUrlCount) {
			mostVisitedUrlCount = info.visits;
			mostVisitedUrl = { url, title: info.title, visits: info.visits };
		}
	}

	return {
		totalHistory: entries.length,
		uniqueUrls: urlSet.size,
		uniqueDomains: domainSet.size,
		uniqueSubdomains: subdomainSet.size,
		firstVisit,
		lastVisit,
		mostActiveDay,
		mostActiveHour,
		averageVisits: groups.length > 0 ? totalVisitCount / groups.length : 0,
		largestDomain,
		mostVisitedDomain,
		mostVisitedUrl
	};
}

/**
 * Compute the distribution data used by charts: top-N lists, time-series,
 * protocol/transition ratios, TLD breakdown.
 */
export function computeDistribution(
	entries: HistoryEntry[],
	groups: GroupedHistory[],
	limit = 10
): HistoryDistribution {
	const domainCounts = new Map<string, number>();
	const subdomainCounts = new Map<string, number>();
	const urlCounts = new Map<string, number>();
	const titleCounts = new Map<string, number>();
	const tldCounts = new Map<string, number>();
	const transitionCounts = new Map<string, number>();

	const dayCounts = new Map<string, number>();
	const hourCounts = new Array<number>(24).fill(0);

	let typedTotal = 0;
	let linkTotal = 0;
	let httpsTotal = 0;
	let httpTotal = 0;

	for (const e of entries) {
		const visits = Math.max(1, e.visitCount || 1);
		domainCounts.set(e.domain, (domainCounts.get(e.domain) ?? 0) + visits);
		const subKey = e.subdomain ? `${e.subdomain}.${e.domain}` : e.domain;
		subdomainCounts.set(subKey, (subdomainCounts.get(subKey) ?? 0) + visits);
		urlCounts.set(e.url, (urlCounts.get(e.url) ?? 0) + visits);
		if (e.title) titleCounts.set(e.title, (titleCounts.get(e.title) ?? 0) + visits);
		if (e.tld) tldCounts.set(e.tld, (tldCounts.get(e.tld) ?? 0) + visits);

		const t = (e.transition || 'link').toLowerCase();
		transitionCounts.set(t, (transitionCounts.get(t) ?? 0) + 1);
		if (t === 'typed' || t === 'generated' || t === 'keyword') typedTotal++;
		else linkTotal++;

		if (e.protocol === 'https') httpsTotal++;
		else if (e.protocol === 'http') httpTotal++;

		const dayKey = utcDayKey(e.visitTime);
		dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + visits);
		hourCounts[new Date(e.visitTime).getUTCHours()] += visits;
	}

	const visitsPerDay: TimeBucket[] = [...dayCounts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([label, value]) => ({ label, value }));

	const visitsPerHour: TimeBucket[] = hourCounts.map((value, h) => ({
		label: String(h),
		value
	}));

	let mostCommonTransition: string | null = null;
	let maxTransition = -1;
	for (const [t, c] of transitionCounts) {
		if (c > maxTransition) {
			maxTransition = c;
			mostCommonTransition = t;
		}
	}

	return {
		topDomains: topN(domainCounts, limit),
		topSubdomains: topN(subdomainCounts, limit),
		topUrls: topNNameOnly(urlCounts, limit, groups),
		topTitles: topN(titleCounts, limit),
		visitsPerDay,
		visitsPerHour,
		mostCommonTransition,
		typedVsLink: { typed: typedTotal, link: linkTotal },
		httpsVsHttp: { https: httpsTotal, http: httpTotal },
		tldDistribution: topN(tldCounts, limit)
	};
}

function topN(map: Map<string, number>, n: number): NameCount[] {
	return [...map.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([name, count]) => ({ name, count }));
}

function topNNameOnly(
	urlMap: Map<string, number>,
	n: number,
	groups: GroupedHistory[]
): NameCount[] {
	// Find the title for each URL from the groups (faster than a second pass).
	const titleByUrl = new Map<string, string>();
	for (const g of groups) {
		for (const u of g.urls) titleByUrl.set(u.url, u.title);
	}
	return [...urlMap.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([url, count]) => ({ name: titleByUrl.get(url) || url, count }));
}

/**
 * Recompute headline stats from a FILTERED set of groups.
 *
 * The Dashboard must reflect filtered results, not the original dataset. The
 * grouped objects already aggregate every visit (counts, time bounds, URLs,
 * transitions, protocol flags), so we can recompute every stat without going
 * back to the raw entries.
 *
 * `totalHistory` here is the sum of visits across the filtered groups, and
 * `uniqueUrls`/`uniqueDomains`/`uniqueSubdomains` count distinct values in the
 * filtered set — exactly what the dashboard should show after filtering.
 */
export function computeStatsFromGroups(groups: GroupedHistory[]): HistoryStats {
	if (groups.length === 0) {
		return {
			totalHistory: 0,
			uniqueUrls: 0,
			uniqueDomains: 0,
			uniqueSubdomains: 0,
			firstVisit: 0,
			lastVisit: 0,
			mostActiveDay: null,
			mostActiveHour: null,
			averageVisits: 0,
			largestDomain: null,
			mostVisitedDomain: null,
			mostVisitedUrl: null
		};
	}

	const urlSet = new Set<string>();
	const domainSet = new Set<string>();
	const subdomainSet = new Set<string>();
	const domainUrlCounts = new Map<string, number>();
	const domainVisitCounts = new Map<string, number>();
	const urlVisitCounts = new Map<string, { title: string; visits: number }>();

	// Day/hour buckets derived from each group's first/last seen bounds.
	// Groups don't store per-visit timestamps, so we approximate the day/hour
	// distribution by attributing each group's totalVisits across the days it
	// spans. This keeps the "most active day/hour" stat meaningful when filtered.
	const dayCounts = new Map<string, number>();
	const hourCounts = new Array<number>(24).fill(0);

	let firstVisit = Infinity;
	let lastVisit = -Infinity;
	let totalVisitCount = 0;

	for (const g of groups) {
		domainSet.add(g.domain);
		subdomainSet.add(`${g.domain}|${g.subdomain}`);
		for (const u of g.urls) {
			urlSet.add(u.url);
			const existing = urlVisitCounts.get(u.url);
			if (existing) existing.visits += u.visitCount;
			else urlVisitCounts.set(u.url, { title: u.title, visits: u.visitCount });
		}

		domainUrlCounts.set(g.domain, (domainUrlCounts.get(g.domain) ?? 0) + g.totalUrls);
		domainVisitCounts.set(g.domain, (domainVisitCounts.get(g.domain) ?? 0) + g.totalVisits);
		totalVisitCount += g.totalVisits;

		if (g.firstSeen < firstVisit) firstVisit = g.firstSeen;
		if (g.lastSeen > lastVisit) lastVisit = g.lastSeen;

		// Distribute this group's visits evenly across the days it spans.
		const startDay = utcDayKey(g.firstSeen);
		const endDay = utcDayKey(g.lastSeen);
		const daySpan = Math.max(1, Math.round((g.lastSeen - g.firstSeen) / 86_400_000) + 1);
		const perDay = g.totalVisits / daySpan;
		let cursor = new Date(g.firstSeen).getTime();
		for (let d = 0; d < daySpan; d++) {
			const key = utcDayKey(cursor);
			dayCounts.set(key, (dayCounts.get(key) ?? 0) + perDay);
			cursor += 86_400_000;
			if (utcDayKey(cursor) > endDay) break;
		}
		// Hour-of-day: attribute to the group's lastSeen hour (a reasonable proxy).
		hourCounts[new Date(g.lastSeen).getUTCHours()] += g.totalVisits;
	}

	let mostActiveDay: string | null = null;
	let mostActiveDayCount = -1;
	for (const [day, count] of dayCounts) {
		if (count > mostActiveDayCount) {
			mostActiveDayCount = count;
			mostActiveDay = day;
		}
	}
	let mostActiveHour: number | null = null;
	let mostActiveHourCount = -1;
	for (let h = 0; h < 24; h++) {
		if (hourCounts[h] > mostActiveHourCount) {
			mostActiveHourCount = hourCounts[h];
			mostActiveHour = h;
		}
	}

	let largestDomain: { domain: string; urls: number } | null = null;
	let largestUrlCount = -1;
	for (const [domain, urls] of domainUrlCounts) {
		if (urls > largestUrlCount) {
			largestUrlCount = urls;
			largestDomain = { domain, urls };
		}
	}
	let mostVisitedDomain: { domain: string; visits: number } | null = null;
	let mostVisitedCount = -1;
	for (const [domain, visits] of domainVisitCounts) {
		if (visits > mostVisitedCount) {
			mostVisitedCount = visits;
			mostVisitedDomain = { domain, visits };
		}
	}
	let mostVisitedUrl: { url: string; title: string; visits: number } | null = null;
	let mostVisitedUrlCount = -1;
	for (const [url, info] of urlVisitCounts) {
		if (info.visits > mostVisitedUrlCount) {
			mostVisitedUrlCount = info.visits;
			mostVisitedUrl = { url, title: info.title, visits: info.visits };
		}
	}

	return {
		totalHistory: totalVisitCount,
		uniqueUrls: urlSet.size,
		uniqueDomains: domainSet.size,
		uniqueSubdomains: subdomainSet.size,
		firstVisit,
		lastVisit,
		mostActiveDay,
		mostActiveHour,
		averageVisits: groups.length > 0 ? totalVisitCount / groups.length : 0,
		largestDomain,
		mostVisitedDomain,
		mostVisitedUrl
	};
}

/**
 * Recompute the distribution (charts data) from a FILTERED set of groups.
 * Mirrors `computeDistribution` but reads from the pre-aggregated group fields
 * instead of re-iterating raw entries.
 */
export function computeDistributionFromGroups(
	groups: GroupedHistory[],
	limit = 10
): HistoryDistribution {
	const domainCounts = new Map<string, number>();
	const subdomainCounts = new Map<string, number>();
	const urlCounts = new Map<string, number>();
	const titleCounts = new Map<string, number>();
	const tldCounts = new Map<string, number>();
	const transitionCounts = new Map<string, number>();

	const dayCounts = new Map<string, number>();
	const hourCounts = new Array<number>(24).fill(0);

	let typedTotal = 0;
	let linkTotal = 0;
	let httpsTotal = 0;
	let httpTotal = 0;

	for (const g of groups) {
		domainCounts.set(g.domain, (domainCounts.get(g.domain) ?? 0) + g.totalVisits);
		const subKey = g.subdomain ? `${g.subdomain}.${g.domain}` : g.domain;
		subdomainCounts.set(subKey, (subdomainCounts.get(subKey) ?? 0) + g.totalVisits);

		for (const u of g.urls) {
			urlCounts.set(u.url, (urlCounts.get(u.url) ?? 0) + u.visitCount);
			if (u.title) titleCounts.set(u.title, (titleCounts.get(u.title) ?? 0) + u.visitCount);
		}
		for (const t of g.titles) {
			if (!titleCounts.has(t)) titleCounts.set(t, 1);
		}

		if (g.domain.includes('.')) {
			const tld = g.domain.split('.').slice(-1)[0];
			if (tld) tldCounts.set(tld, (tldCounts.get(tld) ?? 0) + g.totalVisits);
		}

		for (const t of g.transitions) {
			const lower = t.toLowerCase();
			transitionCounts.set(lower, (transitionCounts.get(lower) ?? 0) + 1);
			if (lower === 'typed' || lower === 'generated' || lower === 'keyword') typedTotal++;
			else linkTotal++;
		}

		if (g.hasHttps) httpsTotal += g.totalVisits;
		if (g.hasHttp) httpTotal += g.totalVisits;

		// Day distribution (same approximation as computeStatsFromGroups).
		const daySpan = Math.max(1, Math.round((g.lastSeen - g.firstSeen) / 86_400_000) + 1);
		const perDay = g.totalVisits / daySpan;
		let cursor = g.firstSeen;
		for (let d = 0; d < daySpan; d++) {
			const key = utcDayKey(cursor);
			dayCounts.set(key, (dayCounts.get(key) ?? 0) + perDay);
			cursor += 86_400_000;
		}
		hourCounts[new Date(g.lastSeen).getUTCHours()] += g.totalVisits;
	}

	const visitsPerDay: TimeBucket[] = [...dayCounts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([label, value]) => ({ label, value: Math.round(value) }));

	const visitsPerHour: TimeBucket[] = hourCounts.map((value, h) => ({
		label: String(h),
		value
	}));

	let mostCommonTransition: string | null = null;
	let maxTransition = -1;
	for (const [t, c] of transitionCounts) {
		if (c > maxTransition) {
			maxTransition = c;
			mostCommonTransition = t;
		}
	}

	return {
		topDomains: topN(domainCounts, limit),
		topSubdomains: topN(subdomainCounts, limit),
		topUrls: topNNameOnly(urlCounts, limit, groups),
		topTitles: topN(titleCounts, limit),
		visitsPerDay,
		visitsPerHour,
		mostCommonTransition,
		typedVsLink: { typed: typedTotal, link: linkTotal },
		httpsVsHttp: { https: httpsTotal, http: httpTotal },
		tldDistribution: topN(tldCounts, limit)
	};
}
