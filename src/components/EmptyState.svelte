<script lang="ts">
	import { FileQuestion, Upload, ShieldCheck } from 'lucide-svelte';
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4 py-12">
	<div class="nb-card max-w-xl p-8 text-center sm:p-12">
		<div
			class="mx-auto mb-6 grid size-20 place-items-center border-[3px] border-ink bg-accent-2 shadow-brutal"
		>
			<FileQuestion size={40} strokeWidth={2.5} />
		</div>
		<h2 class="mb-2 text-2xl font-black tracking-tight sm:text-3xl">No history loaded yet</h2>
		<p class="mx-auto mb-6 max-w-md text-sm font-medium text-ink-soft">
			Drag &amp; drop your exported <code class="nb-chip bg-surface">history.json</code> file onto this
			page, or use the import button. Everything stays on your device.
		</p>
		<div class="flex flex-wrap items-center justify-center gap-3 text-xs font-bold">
			<span class="nb-chip bg-surface"><Upload size={12} strokeWidth={3} /> Drag &amp; drop</span>
			<span class="nb-chip bg-surface"><ShieldCheck size={12} strokeWidth={3} /> Private by design</span>
		</div>
	</div>
</div>
