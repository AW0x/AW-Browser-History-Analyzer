<script lang="ts">
	import { Clock, Github, Shield } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { dataStore } from '$stores/data.svelte';
	import { formatNumber } from '$utils/format';

	let {
		onReset
	}: {
		onReset?: () => void;
	} = $props();

	const totalRecords = $derived(dataStore.data?.stats.totalHistory ?? 0);
</script>

<header
	class="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95 backdrop-blur-sm"
>
	<div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
		<a href="/" class="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Browser History Analyzer home">
			<span
				class="grid size-9 place-items-center border-[3px] border-ink bg-accent text-paper shadow-brutal-sm sm:size-11"
			>
				<Clock size={20} strokeWidth={2.75} />
			</span>
			<span class="hidden sm:block">
				<span class="block text-lg font-black leading-none tracking-tight sm:text-xl">
					HISTORY<span class="text-accent">.</span>ANALYZER
				</span>
				<span class="block text-[10px] font-bold uppercase tracking-widest text-ink-soft">
					100% local · no server
				</span>
			</span>
		</a>

		<div class="flex flex-1 items-center justify-end gap-2 sm:gap-3">
			{#if totalRecords > 0}
				<span
					class="nb-chip hidden bg-accent-3 text-ink md:inline-flex"
					title="Total history records loaded"
				>
					<span class="font-mono font-black">{formatNumber(totalRecords)}</span>
					records
				</span>
				{#if onReset}
					<button
						type="button"
						class="nb-btn bg-surface px-3 py-2 text-xs sm:text-sm"
						onclick={onReset}
						title="Clear loaded data"
					>
						New Import
					</button>
				{/if}
			{/if}

			<a
				href="https://chromewebstore.google.com/detail/quick-chrome-history-expo/acjbkgbpefalkaebgodhnbdgjbignonj"
				target="_blank"
				rel="noopener noreferrer"
				class="nb-btn bg-surface px-3 py-2 text-xs sm:text-sm"
				title="Get the browser history extension"
			>
				<Github size={16} strokeWidth={2.5} class="hidden sm:block" />
				<span class="hidden lg:inline">History Export Extension</span>
				<span class="sm:hidden">Get JSON</span>
			</a>

			<a
				href="https://github.com/AW0x/AW-Browser-History-Analyzer"
				target="_blank"
				rel="noopener noreferrer"
				class="nb-btn bg-surface px-3 py-2 text-xs sm:text-sm"
				title="Get github open source project"
			>
				<Github size={16} strokeWidth={2.5} class="hidden sm:block" />
				<span class="hidden lg:inline">Github: AW0x</span>
				<span class="sm:hidden">Get Code</span>
			</a>

			<ThemeToggle />
		</div>
	</div>

	<!-- Privacy banner -->
	<div class="border-t-[2px] border-ink bg-accent-2/40">
		<div class="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs font-bold sm:px-6">
			<Shield size={14} strokeWidth={2.75} class="shrink-0" />
			<span class="truncate">Your history never leaves this device. No backend, no tracking, no analytics.</span>
		</div>
	</div>
</header>
