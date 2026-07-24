<script lang="ts">
	import { Search, X } from 'lucide-svelte';
	import { dataStore } from '$stores/data.svelte';
	import { debounce } from '$utils/async';

	// The input is bound to `local` for instant feedback; the heavy filter
	// pipeline runs 180ms later via the debounced push to the store. This keeps
	// typing lag-free on large datasets while still feeling instant.
	let local = $state(dataStore.filters.search);

	// True between a keystroke and the debounced store update landing. While
	// pending we ignore store→local sync so we never clobber in-progress typing.
	let pending = false;

	// Debounced writer: collapses rapid keystrokes into one store update.
	const write = debounce((v: string) => {
		dataStore.updateFilters({ search: v });
		pending = false;
	}, 180);

	// Sync external changes (reset, new import) back into the input.
	$effect(() => {
		const storeVal = dataStore.filters.search;
		if (!pending && storeVal !== local) {
			local = storeVal;
		}
	});

	function onInput(e: Event) {
		local = (e.target as HTMLInputElement).value;
		pending = true;
		write(local);
	}

	function clear() {
		write.cancel();
		pending = false;
		local = '';
		dataStore.updateFilters({ search: '' });
	}
</script>

<div class="relative flex-1">
	<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
		<Search size={18} strokeWidth={2.75} />
	</span>
	<input
		type="search"
		class="nb-input w-full py-2.5 pl-11 pr-10 text-sm"
		placeholder="Search domain, URL, title…"
		value={local}
		oninput={onInput}
		aria-label="Search history"
		autocomplete="off"
		spellcheck="false"
	/>
	{#if local}
		<button
			type="button"
			class="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center border-[2px] border-ink bg-surface-alt text-ink-soft hover:bg-accent-2 hover:text-ink"
			onclick={clear}
			aria-label="Clear search"
		>
			<X size={14} strokeWidth={2.75} />
		</button>
	{/if}
</div>
