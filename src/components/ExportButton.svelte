<script lang="ts">
	import { Download } from 'lucide-svelte';
	import { dataStore } from '$stores/data.svelte';
	import { toastStore } from '$stores/ui.svelte';
	import { derivedStore } from '$stores/derived.svelte';

	let { label = false }: { label?: boolean } = $props();

	function exportJson() {
		const data = dataStore.data;
		if (!data) return;
		// Export shape per spec: filtered groups, pretty-printed.
		const groups = derivedStore.filtered;
		const payload = groups.map((g) => ({
			domain: g.domain,
			subdomain: g.subdomain,
			firstSeen: new Date(g.firstSeen).toISOString(),
			lastSeen: new Date(g.lastSeen).toISOString(),
			totalVisits: g.totalVisits,
			urls: g.urls
		}));
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const stamp = new Date().toISOString().slice(0, 10);
		a.download = `chrome-history-analyzed-${stamp}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toastStore.push(`Exported ${groups.length} groups`, 'success');
	}
</script>

<button
	type="button"
	class="nb-btn bg-accent-3 px-3 py-2 text-xs text-ink"
	onclick={exportJson}
	title="Export filtered data as JSON"
	aria-label="Export filtered history as JSON"
>
	<Download size={16} strokeWidth={2.75} />
	{#if label}<span>Export JSON</span>{/if}
</button>
