<script lang="ts">
	import { onMount } from 'svelte';
	import AppHeader from '$components/AppHeader.svelte';
	import Footer from '$components/Footer.svelte';
	import ImportButton from '$components/ImportButton.svelte';
	import EmptyState from '$components/EmptyState.svelte';
	import LoadingState from '$components/LoadingState.svelte';
	import ErrorState from '$components/ErrorState.svelte';
	import ToastContainer from '$components/ToastContainer.svelte';
	import Dashboard from '$components/Dashboard.svelte';
	import StatisticsPanel from '$components/charts/StatisticsPanel.svelte';
	import FilterBar from '$components/filters/FilterBar.svelte';
	import HistoryGrid from '$components/cards/HistoryGrid.svelte';
	import UrlModal from '$components/modal/UrlModal.svelte';
	import ExportButton from '$components/ExportButton.svelte';
	import { dataStore } from '$stores/data.svelte';
	import { derivedStore } from '$stores/derived.svelte';
	import { toastStore } from '$stores/ui.svelte';
	import { themeStore } from '$stores/theme.svelte';
	import { processHistoryFile, ImportError } from '$history/pipeline';
	import { normalizeEntries } from '$history/group';
	import { groupHistory } from '$history/group';
	import { computeStats, computeDistribution } from '$history/stats';
	import { generateSampleHistory } from '$history/sample';
	import type { GroupedHistory } from '$types';
	import { History, Sparkles, FileJson, Clock3, LayoutGrid } from 'lucide-svelte';

	let modalGroup = $state<GroupedHistory | null>(null);

	onMount(() => {
		themeStore.syncSystem();
	});

	async function handleFile(file: File) {
		dataStore.setLoading();
		try {
			const data = await processHistoryFile(file, (p) => dataStore.setProgress(p));
			dataStore.setData(data);
			toastStore.push(`Loaded ${data.entries.length.toLocaleString()} history records`, 'success');
		} catch (e) {
			const msg =
				e instanceof ImportError
					? e.message
					: e instanceof Error
						? e.message
						: 'Unknown error during import.';
			dataStore.setError(msg);
			toastStore.push('Import failed', 'error');
		}
	}

	async function loadSample() {
		dataStore.setLoading();
		dataStore.setProgress(0.2);
		await new Promise((r) => setTimeout(r, 30));
		const raw = generateSampleHistory(1500);
		const entries = normalizeEntries(raw);
		dataStore.setProgress(0.5);
		await new Promise((r) => setTimeout(r, 30));
		const groups = groupHistory(entries);
		dataStore.setProgress(0.8);
		await new Promise((r) => setTimeout(r, 30));
		const stats = computeStats(entries, groups);
		const distribution = computeDistribution(entries, groups);
		dataStore.setData({ entries, groups, stats, distribution });
		toastStore.push('Loaded sample dataset — 1,500 records', 'success');
	}

	function reset() {
		dataStore.reset();
		modalGroup = null;
		toastStore.push('Cleared loaded data', 'info');
	}

	const filteredGroups = $derived(derivedStore.filtered);
</script>

<svelte:head>
	<title>@AW0x - Browser History Analyzer (Local &amp; Private)</title>
	<meta
		name="description"
		content="Import your Chrome history JSON and explore it with Neo-Brutalist charts, filters, and search — 100% in your browser."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:nb-btn focus:bg-accent focus:px-4 focus:py-2 focus:text-paper"
	>
		Skip to content
	</a>
	<AppHeader onReset={dataStore.status === 'ready' ? reset : undefined} />

	<main id="main-content" class="flex-1">
		{#if dataStore.status === 'ready' && dataStore.data}
			<Dashboard />
			<StatisticsPanel />

			<FilterBar />

			<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
				<div class="mb-4 flex items-center justify-between gap-3">
					<div class="flex items-center gap-2">
						<span class="grid size-8 place-items-center border-[3px] border-ink bg-accent shadow-brutal-sm">
							<LayoutGrid size={18} strokeWidth={2.75} />
						</span>
						<h2 class="text-xl font-black tracking-tight sm:text-2xl">History Groups</h2>
					</div>
					<ExportButton label />
				</div>
				<HistoryGrid groups={filteredGroups} onViewUrls={(g) => (modalGroup = g)} />
			</section>
		{:else if dataStore.status === 'loading'}
			<LoadingState label="Processing history…" />
		{:else if dataStore.status === 'error'}
			<ErrorState onRetry={reset} />
		{:else}
			<!-- Empty state: hero + import -->
			<section class="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
				<div class="mb-10 text-center">
					<div
						class="mx-auto mb-6 grid size-16 place-items-center border-[3px] border-ink bg-accent shadow-brutal-lg sm:size-20"
					>
						<History size={36} strokeWidth={2.75} />
					</div>
					<h1 class="text-balance text-4xl font-black tracking-tight sm:text-6xl">
						Your browser history.<br />
						<span class="text-accent">Analyzed.</span>
					</h1>
					<p class="mx-auto mt-4 max-w-xl text-balance text-base font-medium text-ink-soft sm:text-lg">
						Drop the JSON from Quick Chrome History Export and get instant stats, charts, and
						searchable cards. Nothing leaves your device.
					</p>
				</div>

				<div class="mx-auto max-w-xl">
					<ImportButton onFile={handleFile} />

					<div class="mt-6 flex flex-wrap items-stretch justify-center gap-3">
						<button
							type="button"
							class="nb-btn bg-surface px-4 py-2.5 text-sm"
							onclick={loadSample}
						>
							<Sparkles size={16} strokeWidth={2.75} />
							Try with sample data
						</button>
						<a
							href="https://chromewebstore.google.com/detail/quick-chrome-history-expo/acjbkgbpefalkaebgodhnbdgjbignonj"
							target="_blank"
							rel="noopener noreferrer"
							class="nb-btn bg-accent-2 px-4 py-2.5 text-sm"
						>
							<FileJson size={16} strokeWidth={2.75} />
							Get Browser History Export Extension
						</a>
					</div>
				</div>

				<!-- Feature strip -->
				<div class="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
					{#each [{ icon: History, label: '100% local', desc: 'No server, ever' }, { icon: Clock3, label: 'Instant stats', desc: 'Charts in milliseconds' }, { icon: Sparkles, label: 'Fuzzy search', desc: 'Find anything fast' }] as feature}
						<div class="nb-card flex flex-col items-center gap-2 p-5 text-center">
							<span class="grid size-10 place-items-center border-[2px] border-ink bg-surface-alt">
								<feature.icon size={20} strokeWidth={2.5} />
							</span>
							<span class="font-black">{feature.label}</span>
							<span class="text-xs font-medium text-ink-soft">{feature.desc}</span>
						</div>
					{/each}
				</div>
			</section>

			<EmptyState />
		{/if}
	</main>

	<Footer />
	<ToastContainer />
	<UrlModal group={modalGroup} onClose={() => (modalGroup = null)} />
</div>
