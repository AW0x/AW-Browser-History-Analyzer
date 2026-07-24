/** Copy text to the clipboard with a graceful fallback for non-secure contexts. */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		// Fallback: hidden textarea + execCommand (works on http and older browsers).
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.left = '-9999px';
		ta.setAttribute('readonly', '');
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(ta);
		return ok;
	} catch {
		return false;
	}
}

/** Truncate the middle of a long URL per the spec:
 *   https://example.com/very/long/...
 *   .../article?id=123
 */
export function shortenUrl(url: string, maxLen = 48): { lines: string[]; full: string } {
	const full = url;
	if (url.length <= maxLen) return { lines: [url], full };
	const slash = url.indexOf('/', 8); // skip "https://"
	if (slash === -1) return { lines: [url.slice(0, maxLen) + '...'], full };

	const head = url.slice(0, Math.min(maxLen, url.length));
	const tailStart = url.lastIndexOf('/');
	const tail = url.slice(tailStart);

	if (tailStart <= maxLen) {
		return { lines: [url], full };
	}

	return {
		lines: [head.slice(0, head.lastIndexOf('/')) + '/...', '.../' + tail],
		full
	};
}

/** Pluralize a count: "1 visit" / "5 visits". */
export function pluralize(count: number, singular: string, plural?: string): string {
	return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`;
}

/** Format a large number with thousands separators. */
export function formatNumber(n: number): string {
	return n.toLocaleString('en-US');
}

/** Compact form for stat cards: 1200 -> "1.2k". */
export function formatCompact(n: number): string {
	if (n < 1000) return String(n);
	if (n < 1_000_000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
	return (n / 1_000_000).toFixed(1) + 'M';
}
