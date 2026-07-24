<script lang="ts">
	import Favicon from '$components/Favicon.svelte';
	import type { GroupedHistory } from '$types';
	import { shortenUrl, copyToClipboard, formatNumber } from '$utils/format';
	import { formatRelative, formatUtc } from '$utils/date';
	import { toastStore } from '$stores/ui.svelte';
	import { bookmarkStore } from '$stores/ui.svelte';
	import BookmarkButton from '$components/BookmarkButton.svelte';
	import { X, ExternalLink, Copy, Search } from 'lucide-svelte';

	let {
		group = $bindable(),
		onClose
	}: {
		group: GroupedHistory | null;
		onClose: () => void;
	} = $props();

	let query = $state('');

	// Sort URLs by visit count descending, optional client-side filter.
	const sortedUrls = $derived(
		group
			? [...group.urls]
					.sort((a, b) => b.visitCount - a.visitCount)
					.filter((u) => {
						const q = query.trim().toLowerCase();
						if (!q) return true;
						return (
							u.url.toLowerCase().includes(q) ||
							u.title.toLowerCase().includes(q)
						);
					})
			: []
	);

	const hostname = $derived(
		group ? (group.subdomain ? `${group.subdomain}.${group.domain}` : group.domain) : ''
	);

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	async function copyUrl(url: string) {
		const ok = await copyToClipboard(url);
		toastStore.push(ok ? 'URL copied' : 'Copy failed', ok ? 'success' : 'error');
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if group}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
		onclick={onClose}
		role="presentation"
	>
		<!-- Modal panel -->
		<div
			class="nb-card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden bg-surface"
			role="dialog"
			aria-modal="true"
			aria-label={`URLs for ${group.domain}`}
			tabindex="-1"
		>
			<!-- Header -->
			<div class="flex items-center gap-3 border-b-[3px] border-ink bg-accent-2 p-4">
				<span class="grid size-10 shrink-0 place-items-center border-[2px] border-ink bg-surface">
					<Favicon hostname={hostname} letter={group.domain.slice(0, 1)} size={22} />
				</span>
				<div class="min-w-0 flex-1">
					<h2 class="truncate text-lg font-black tracking-tight">{group.domain}</h2>
					<p class="text-xs font-bold text-ink-soft">
						{formatNumber(group.totalUrls)} URLs · {formatNumber(group.totalVisits)} visits
					</p>
				</div>
				<BookmarkButton domain={group.domain} label />
				<button
					type="button"
					class="nb-btn bg-surface px-2 py-2"
					onclick={onClose}
					aria-label="Close modal"
				>
					<X size={18} strokeWidth={2.75} />
				</button>
			</div>

			<!-- Search + visit link -->
			<div class="flex items-center gap-2 border-b-[2px] border-ink bg-surface-alt p-3">
				<div class="relative flex-1">
					<span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft">
						<Search size={14} strokeWidth={2.75} />
					</span>
					<input
						type="search"
						class="nb-input w-full py-1.5 pl-8 pr-2 text-xs"
						placeholder="Filter URLs…"
						bind:value={query}
						aria-label="Filter URLs in this group"
					/>
				</div>
				<a
					href={`https://${hostname}`}
					target="_blank"
					rel="noopener noreferrer"
					class="nb-btn bg-accent-3 px-3 py-1.5 text-xs text-ink"
				>
					<ExternalLink size={14} strokeWidth={2.75} />
					Visit
				</a>
			</div>

			<!-- URL list (scrollable) -->
			<div class="flex-1 overflow-y-auto p-3">
				<ul class="flex flex-col gap-2">
					{#each sortedUrls as u (u.url)}
						{@const short = shortenUrl(u.url)}
						<li class="nb-card flex items-start gap-3 p-3">
							<span class="grid size-8 shrink-0 place-items-center border-[2px] border-ink bg-surface-alt">
								<Favicon hostname={hostname} letter={(u.title || u.url).slice(0, 1)} size={16} />
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-bold" title={u.title}>{u.title || u.url}</p>
								<p class="font-mono text-[11px] leading-tight text-ink-soft" title={u.url}>
									{#each short.lines as line}
										<span class="block truncate">{line}</span>
									{/each}
								</p>
								<div class="mt-1 flex items-center gap-3 text-[10px] font-bold">
									<span class="nb-chip bg-accent text-paper">{formatNumber(u.visitCount)} visits</span>
									<span class="text-ink-soft">First {formatRelative(u.firstSeen)}</span>
									<span class="text-ink-soft">Last {formatRelative(u.lastSeen)}</span>
								</div>
							</div>
							<div class="flex shrink-0 flex-col gap-1">
								<a
									href={u.url}
									target="_blank"
									rel="noopener noreferrer"
									class="nb-btn bg-accent-4 px-2 py-1.5 text-xs text-paper"
									aria-label={`Open ${u.url} in a new tab`}
								>
									<ExternalLink size={12} strokeWidth={2.75} />
								</a>
								<button
									type="button"
									class="nb-btn bg-surface px-2 py-1.5 text-xs"
									onclick={() => copyUrl(u.url)}
									aria-label={`Copy URL to clipboard`}
									title="Copy URL"
								>
									<Copy size={12} strokeWidth={2.75} />
								</button>
							</div>
						</li>
					{/each}
					{#if sortedUrls.length === 0}
						<li class="py-8 text-center text-sm font-bold text-ink-soft">No URLs match "{query}"</li>
					{/if}
				</ul>
			</div>
		</div>
	</div>
{/if}
