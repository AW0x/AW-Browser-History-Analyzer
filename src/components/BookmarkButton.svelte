<script lang="ts">
	import { Bookmark, BookmarkCheck } from 'lucide-svelte';
	import { bookmarkStore } from '$stores/ui.svelte';
	import { clsx } from '$lib/clsx';

	let {
		domain,
		size = 18,
		label = false
	}: {
		domain: string;
		size?: number;
		label?: boolean;
	} = $props();

	const active = $derived(bookmarkStore.has(domain));
</script>

<button
	type="button"
	class={clsx(
		'nb-btn gap-1.5 px-2.5 py-1.5 text-xs',
		active ? 'bg-accent-2 text-ink' : 'bg-surface text-ink'
	)}
	onclick={() => bookmarkStore.toggle(domain)}
	aria-pressed={active}
	aria-label={active ? `Remove bookmark for ${domain}` : `Bookmark ${domain}`}
	title={active ? 'Bookmarked' : 'Bookmark this domain'}
>
	<span class={active ? 'animate-[pop_240ms_ease-out]' : ''}>
		{#if active}
			<BookmarkCheck {size} strokeWidth={2.75} fill="currentColor" />
		{:else}
			<Bookmark {size} strokeWidth={2.5} />
		{/if}
	</span>
	{#if label}
		<span>{active ? 'Saved' : 'Bookmark'}</span>
	{/if}
</button>

<style>
	@keyframes pop {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.4) rotate(-8deg);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}
</style>
