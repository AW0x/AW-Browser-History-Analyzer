<script lang="ts">
	import Favicon from '$components/Favicon.svelte';
	import BookmarkButton from '$components/BookmarkButton.svelte';
	import type { GroupedHistory } from '$types';
	import { formatNumber, formatCompact } from '$utils/format';
	import { formatRelative, formatUtc } from '$utils/date';
	import { highlightMatches } from '$utils/highlight';
	import { dataStore } from '$stores/data.svelte';
	import { clsx } from '$lib/clsx';
	import { ExternalLink, List, Copy } from 'lucide-svelte';
	import { copyToClipboard } from '$utils/format';
	import { toastStore } from '$stores/ui.svelte';

	let {
		group,
		onViewUrls
	}: {
		group: GroupedHistory;
		onViewUrls?: (group: GroupedHistory) => void;
	} = $props();

	const hostname = $derived(group.subdomain ? `${group.subdomain}.${group.domain}` : group.domain);
	const query = $derived(dataStore.filters.search.trim());
	const domainSegments = $derived(highlightMatches(group.domain, query));
	const titleSegments = $derived(highlightMatches(group.titles[0] ?? '', query));

	async function copyDomain() {
		const ok = await copyToClipboard(group.domain);
		toastStore.push(ok ? `Copied ${group.domain}` : 'Copy failed', ok ? 'success' : 'error');
	}
</script>

<article
	class="nb-card nb-card-hover flex flex-col gap-3 p-4 sm:p-5"
	aria-label={`${group.domain} — ${formatNumber(group.totalVisits)} visits`}
>
	<!-- Header: favicon + domain -->
	<div class="flex items-start gap-3">
		<span class="grid size-9 shrink-0 place-items-center border-[2px] border-ink bg-surface-alt">
			<Favicon hostname={hostname} letter={group.domain.slice(0, 1)} size={20} />
		</span>
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-base font-black leading-tight tracking-tight" title={group.domain}>
				{#each domainSegments as seg}{#if seg.match}<mark class="bg-accent-2 text-ink">{seg.text}</mark>{:else}{seg.text}{/if}{/each}
			</h3>
			{#if group.subdomain}
				<p class="truncate text-xs font-semibold text-ink-soft" title={group.subdomain}>
					{group.subdomain}
				</p>
			{/if}
		</div>
		<BookmarkButton domain={group.domain} />
	</div>

	<!-- Stats row -->
	<div class="grid grid-cols-2 gap-2">
		<div class="border-[2px] border-ink bg-accent px-2 py-1.5 text-paper">
			<div class="text-[10px] font-black uppercase tracking-wider opacity-80">Visits</div>
			<div class="font-mono text-lg font-black leading-none">{formatCompact(group.totalVisits)}</div>
		</div>
		<div class="border-[2px] border-ink bg-surface-alt px-2 py-1.5">
			<div class="text-[10px] font-black uppercase tracking-wider text-ink-soft">URLs</div>
			<div class="font-mono text-lg font-black leading-none">{formatCompact(group.totalUrls)}</div>
		</div>
	</div>

	<!-- Time info -->
	<div class="flex flex-col gap-1 text-xs font-semibold">
		<div class="flex items-center justify-between gap-2">
			<span class="text-ink-soft">First seen</span>
			<span class="font-mono font-bold" title={formatUtc(group.firstSeen)}>
				{formatRelative(group.firstSeen)}
			</span>
		</div>
		<div class="flex items-center justify-between gap-2">
			<span class="text-ink-soft">Last seen</span>
			<span class="font-mono font-bold" title={formatUtc(group.lastSeen)}>
				{formatRelative(group.lastSeen)}
			</span>
		</div>
	</div>

	<!-- Titles preview -->
	{#if group.titles.length > 0}
		<p class="line-clamp-2 text-xs font-medium text-ink-soft" title={group.titles[0]}>
			{#each titleSegments as seg}{#if seg.match}<mark class="bg-accent-2 text-ink">{seg.text}</mark>{:else}{seg.text}{/if}{/each}
		</p>
	{/if}

	<!-- Action buttons -->
	<div class="mt-1 flex flex-wrap gap-2">
		<button
			type="button"
			class="nb-btn flex-1 bg-accent-4 px-2 py-1.5 text-xs text-paper"
			onclick={() => onViewUrls?.(group)}
		>
			<List size={14} strokeWidth={2.75} />
			View URLs
		</button>
		<a
			href={`https://${hostname}`}
			target="_blank"
			rel="noopener noreferrer"
			class="nb-btn bg-accent-3 px-2 py-1.5 text-xs text-ink"
			aria-label={`Visit ${hostname} in a new tab`}
		>
			<ExternalLink size={14} strokeWidth={2.75} />
			Visit
		</a>
		<button
			type="button"
			class="nb-btn bg-surface px-2 py-1.5 text-xs"
			onclick={copyDomain}
			aria-label={`Copy ${group.domain} to clipboard`}
			title="Copy domain"
		>
			<Copy size={14} strokeWidth={2.75} />
		</button>
	</div>
</article>
