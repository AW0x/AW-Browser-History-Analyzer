import type { NormalizedUrl } from '$types';

/**
 * A small, dependency-free public-suffix list. The full PSL is ~14k lines;
 * for a history analyzer we only need the common multi-part suffixes
 * (country-code second levels like co.uk, com.au) to compute `rootDomain`
 * and `tld` correctly. Single-label TLDs fall back to the last label.
 */
const MULTI_PART_TLDS = new Set([
	'co.uk',
	'org.uk',
	'gov.uk',
	'ac.uk',
	'me.uk',
	'com.au',
	'net.au',
	'org.au',
	'com.br',
	'org.br',
	'co.jp',
	'co.kr',
	'co.nz',
	'co.in',
	'co.za',
	'com.mx',
	'com.ar',
	'com.tr',
	'com.cn',
	'com.tw',
	'com.hk',
	'com.sg',
	'com.my',
	'com.ph',
	'com.vn',
	'co.id'
]);

const EMPTY: NormalizedUrl = {
	protocol: '',
	hostname: '',
	domain: '',
	subdomain: '',
	pathname: '/',
	query: '',
	hash: '',
	tld: '',
	rootDomain: ''
};

/**
 * Normalize a URL into its component parts. Pure & fast — called once per
 * raw entry and never recomputed. Invalid URLs collapse to an empty object
 * (the caller decides whether to keep or discard them).
 *
 * We avoid `new URL()` for non-http schemes that throw; instead we use it
 * defensively and fall back to a regex parse.
 */
export function normalizeUrl(rawUrl: string): NormalizedUrl {
	if (!rawUrl || typeof rawUrl !== 'string') return { ...EMPTY };

	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		return { ...EMPTY, pathname: rawUrl };
	}

	const protocol = url.protocol.replace(':', '');
	const hostname = url.hostname.toLowerCase();
	const pathname = url.pathname || '/';
	const query = url.search;
	const hash = url.hash;

	// localhost / IP / internal hosts — no meaningful domain split.
	if (!hostname || hostname === 'localhost' || isIpAddress(hostname) || isInternalHost(hostname)) {
		return {
			protocol,
			hostname,
			domain: hostname,
			subdomain: '',
			pathname,
			query,
			hash,
			tld: '',
			rootDomain: hostname
		};
	}

	const parts = hostname.split('.');
	const tld = extractTld(parts);
	const rootDomain = extractRootDomain(parts, tld);
	// subdomain = everything before the root domain.
	const rootLabelCount = tld ? tld.split('.').length + 1 : 1;
	const subParts = parts.slice(0, Math.max(0, parts.length - rootLabelCount));
	const subdomain = subParts.join('.');

	return {
		protocol,
		hostname,
		domain: rootDomain || hostname,
		subdomain,
		pathname,
		query,
		hash,
		tld,
		rootDomain: rootDomain || hostname
	};
}

function isIpAddress(host: string): boolean {
	// IPv4
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
	// IPv6 (possibly bracketed)
	return host.startsWith('[') && host.endsWith(']');
}

function isInternalHost(host: string): boolean {
	return host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.');
}

function extractTld(parts: string[]): string {
	if (parts.length < 2) return parts[0] ?? '';
	const lastTwo = parts.slice(-2).join('.');
	if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) {
		return lastTwo;
	}
	return parts[parts.length - 1];
}

function extractRootDomain(parts: string[], tld: string): string {
	if (!tld) return parts[parts.length - 1] ?? '';
	const tldLabels = tld.split('.').length;
	const rootIndex = parts.length - tldLabels - 1;
	if (rootIndex < 0) return parts.join('.');
	return parts[rootIndex] + '.' + tld;
}

/**
 * Convert a normalized URL into a favicon URL using Google's favicon service.
 * This is the only outbound request the app makes, and only on demand (lazy
 * <img> loading) — it does not transmit user history, only the public domain.
 */
export function faviconUrl(hostname: string, size = 32): string {
	if (!hostname) return '';
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${size}`;
}

/** A data: URL SVG placeholder used when no favicon loads (keeps layout stable). */
export function faviconPlaceholder(letter: string): string {
	const safe = (letter || '?').slice(0, 1).toUpperCase();
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#efe9df" stroke="#0d0d0d" stroke-width="2"/><text x="16" y="22" font-family="monospace" font-size="16" font-weight="900" text-anchor="middle" fill="#0d0d0d">${safe}</text></svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
