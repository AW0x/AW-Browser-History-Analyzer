import type { GroupedHistory, GroupedUrl, HistoryEntry, RawHistoryItem } from '$types';
import { normalizeUrl } from './normalize';

/**
 * Convert raw export items into normalized history entries.
 * Each entry carries its normalized URL breakdown so we never re-parse URLs.
 *
 * Entries with an unparseable URL (no hostname) are kept but flagged via
 * empty `domain` — the caller can filter them out if desired.
 */
export function normalizeEntries(raw: RawHistoryItem[]): HistoryEntry[] {
	const out: HistoryEntry[] = new Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		const r = raw[i];
		const n = normalizeUrl(r.url);
		out[i] = {
			...n,
			id: r.id,
			title: r.title ?? '',
			url: r.url,
			visitTime: r.visitTime,
			visitCount: r.visitCount ?? 0,
			typedCount: r.typedCount ?? 0,
			transition: r.transition ?? 'link',
			isLocal: r.isLocal ?? false
		};
	}
	return out;
}

/**
 * Group normalized entries by `(domain, subdomain)` and aggregate.
 *
 * Deduplication happens at multiple levels:
 *  - URL level: distinct URLs inside a group are deduped by full URL string.
 *  - Domain/Subdomain level: the group key is `${domain}\u0000${subdomain}`,
 *    so `mail.google.com` and `docs.google.com` are separate groups but both
 *    roll up under `google.com` in stats.
 *
 * Each group aggregates first/last seen, total visits, and the distinct URL list.
 *
 * Returns groups sorted by total visits descending (most active first) — the
 * default sort the UI applies can re-sort further without re-aggregating.
 */
export function groupHistory(entries: HistoryEntry[]): GroupedHistory[] {
	// Key = domain + NUL + subdomain. NUL can't appear in hostnames.
	const groups = new Map<string, GroupedHistory>();
	// Per-group map of URL -> GroupedUrl so we dedupe & aggregate URL-level visits.
	const urlMaps = new Map<string, Map<string, GroupedUrl>>();
	const titleSets = new Map<string, Set<string>>();
	const transitionSets = new Map<string, Set<string>>();

	for (let i = 0; i < entries.length; i++) {
		const e = entries[i];
		const key = `${e.domain}\u0000${e.subdomain}`;
		let group = groups.get(key);
		if (!group) {
			group = {
				domain: e.domain,
				subdomain: e.subdomain,
				firstSeen: e.visitTime,
				lastSeen: e.visitTime,
				totalVisits: 0,
				totalUrls: 0,
				urls: [],
				titles: [],
				transitions: [],
				hasHttps: false,
				hasHttp: false
			};
			groups.set(key, group);
			urlMaps.set(key, new Map());
			titleSets.set(key, new Set());
			transitionSets.set(key, new Set());
		}

		// Aggregate time bounds + visit count.
		if (e.visitTime < group.firstSeen) group.firstSeen = e.visitTime;
		if (e.visitTime > group.lastSeen) group.lastSeen = e.visitTime;
		group.totalVisits += Math.max(1, e.visitCount || 1);

		// Protocol ratio flags.
		if (e.protocol === 'https') group.hasHttps = true;
		else if (e.protocol === 'http') group.hasHttp = true;

		// Title / transition aggregation (deduped sets).
		if (e.title) titleSets.get(key)!.add(e.title);
		if (e.transition) transitionSets.get(key)!.add(e.transition);

		// URL-level dedupe + aggregate.
		const urlMap = urlMaps.get(key)!;
		const existing = urlMap.get(e.url);
		if (existing) {
			existing.visitCount += Math.max(1, e.visitCount || 1);
			if (e.visitTime < existing.firstSeen) existing.firstSeen = e.visitTime;
			if (e.visitTime > existing.lastSeen) existing.lastSeen = e.visitTime;
		} else {
			urlMap.set(e.url, {
				title: e.title,
				url: e.url,
				visitCount: Math.max(1, e.visitCount || 1),
				firstSeen: e.visitTime,
				lastSeen: e.visitTime,
				protocol: e.protocol,
				pathname: e.pathname
			});
		}
	}

	// Flatten sets into arrays + finalize URL lists.
	const result: GroupedHistory[] = new Array(groups.size);
	let idx = 0;
	for (const [key, group] of groups) {
		const urlMap = urlMaps.get(key)!;
		group.urls = [...urlMap.values()];
		group.totalUrls = group.urls.length;
		group.titles = [...titleSets.get(key)!];
		group.transitions = [...transitionSets.get(key)!];
		result[idx++] = group;
	}

	// Default sort: most visits first.
	result.sort((a, b) => b.totalVisits - a.totalVisits);
	return result;
}
