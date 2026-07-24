/**
 * Split a string into segments, marking which ones match the query.
 * Used to render highlighted search matches inside titles/domains.
 */
export interface TextSegment {
	text: string;
	match: boolean;
}

/**
 * Returns segments of `text` with fuzzy-match runs of `query` flagged.
 * Case-insensitive, sequential (subsequence) matching — cheap and good enough
 * for highlighting without pulling Fuse's internals apart.
 */
export function highlightMatches(text: string, query: string): TextSegment[] {
	if (!query || !text) return [{ text, match: false }];
	const q = query.toLowerCase();
	const t = text.toLowerCase();

	// Find the first subsequence match window.
	let qi = 0;
	let start = -1;
	let end = -1;
	for (let i = 0; i < t.length && qi < q.length; i++) {
		if (t[i] === q[qi]) {
			if (start === -1) start = i;
			end = i + 1;
			qi++;
		}
	}

	if (qi < q.length || start === -1) {
		// No match — return the whole text unhighlighted.
		return [{ text, match: false }];
	}

	const segments: TextSegment[] = [];
	if (start > 0) segments.push({ text: text.slice(0, start), match: false });
	segments.push({ text: text.slice(start, end), match: true });
	if (end < text.length) segments.push({ text: text.slice(end), match: false });
	return segments;
}
