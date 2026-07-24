import type { RawHistoryItem } from '$types';

/**
 * Generate plausible fake history data so users can try the app without an
 * exported JSON file. Deterministic given a seed — not cryptographically random.
 *
 * Used by the "Load sample data" button on the empty state.
 */
const SAMPLE_DOMAINS = [
	['github.com', ['/', '/pulls', '/issues', '/trending', '/search?q=svelte']],
	['google.com', ['/search?q=svelte', '/search?q=tailwind', '/maps', '/mail']],
	['stackoverflow.com', ['/questions', '/questions/tagged/svelte', '/users']],
	['youtube.com', ['/watch?v=dQw4w9WgXcQ', '/feed/subscriptions', '/playlist']],
	['reddit.com', ['/r/sveltejs', '/r/webdev', '/r/programming']],
	['twitter.com', ['/home', '/explore', '/notifications']],
	['developer.mozilla.org', ['/en-US/docs/Web', '/en-US/docs/CSS']],
	['npmjs.com', ['/package/svelte', '/package/tailwindcss']],
	['news.ycombinator.com', ['/', '/item?id=12345']],
	['wikipedia.org', ['/wiki/Svelte', '/wiki/TypeScript']],
	['linkedin.com', ['/feed', '/messaging']],
	['amazon.com', ['/cart', '/dp/B08N5WRWNW']],
	['netflix.com', ['/browse', '/title/80057281']],
	['spotify.com', ['/playlist/37i9dQZF1DXcBWIGoYBM5M']],
	['figma.com', ['/file/abc123/Design']],
	['vercel.com', ['/dashboard', '/docs']],
	['openai.com', ['/blog', '/chatgpt']],
	['arxiv.org', ['/abs/2401.00001']],
	['medium.com', ['/@user/article']],
	['notion.so', ['/workspace/page']]
] as const;

const TRANSITIONS = ['link', 'typed', 'reload', 'link', 'link', 'form_submit'];

export function generateSampleHistory(count = 1500): RawHistoryItem[] {
	const items: RawHistoryItem[] = [];
	const now = Date.now();
	const dayMs = 86_400_000;
	let seed = 12345;
	const rand = () => {
		// xorshift32 — deterministic, fast.
		seed ^= seed << 13;
		seed ^= seed >>> 17;
		seed ^= seed << 5;
		return ((seed >>> 0) % 100000) / 100000;
	};

	for (let i = 0; i < count; i++) {
		const [domain, paths] = SAMPLE_DOMAINS[i % SAMPLE_DOMAINS.length];
		const path = paths[Math.floor(rand() * paths.length)];
		const subdomain = rand() < 0.2 ? 'www' : '';
		const host = subdomain ? `${subdomain}.${domain}` : domain;
		const url = `https://${host}${path}?r=${Math.floor(rand() * 100)}`;
		// Spread visits across the last 60 days.
		const visitTime = now - Math.floor(rand() * 60) * dayMs - Math.floor(rand() * dayMs);
		items.push({
			id: `sample-${i}`,
			history_id: `hist-${i}`,
			title: `${domain.split('.')[0]} — ${path}`,
			url,
			visitTime,
			visitCount: 1 + Math.floor(rand() * 20),
			typedCount: rand() < 0.3 ? 1 : 0,
			transition: TRANSITIONS[Math.floor(rand() * TRANSITIONS.length)],
			isLocal: false
		});
	}
	return items;
}
