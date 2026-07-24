<script lang="ts">
	import { Upload, FileJson } from 'lucide-svelte';
	import { clsx } from '$lib/clsx';

	let {
		onFile,
		disabled = false
	}: {
		onFile: (file: File) => void;
		disabled?: boolean;
	} = $props();

	let inputEl = $state<HTMLInputElement>();
	let dragging = $state(false);
	let dragCounter = $state(0);

	function pick() {
		inputEl?.click();
	}

	function onInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) onFile(file);
		target.value = ''; // allow re-selecting the same file
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		dragCounter = 0;
		if (disabled) return;
		const file = e.dataTransfer?.files?.[0];
		if (file) onFile(file);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled && !dragging) dragging = true;
	}

	function onDragEnter(e: DragEvent) {
		e.preventDefault();
		dragCounter++;
		if (!disabled) dragging = true;
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		dragCounter--;
		if (dragCounter <= 0) {
			dragging = false;
			dragCounter = 0;
		}
	}

	const svelteHandler = {
		drop: onDrop,
		dragover: onDragOver,
		dragenter: onDragEnter,
		dragleave: onDragLeave
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={clsx(
		'relative transition-[transform,box-shadow] duration-150',
		dragging && 'scale-[1.01]',
		dragging && 'z-10'
	)}
	{...svelteHandler}
>
	<button
		type="button"
		class={clsx(
			'nb-btn w-full gap-3 px-6 py-5 text-base sm:text-lg',
			dragging ? 'bg-accent-3 text-ink' : 'bg-accent text-paper',
			disabled && 'opacity-50'
		)}
		onclick={pick}
		disabled={disabled}
		aria-label="Import Chrome history JSON file"
	>
		{#if dragging}
			<FileJson size={22} strokeWidth={2.75} />
			<span>Drop your history.json here</span>
		{:else}
			<Upload size={22} strokeWidth={2.75} />
			<span>Import history JSON</span>
		{/if}
	</button>

	<!-- Dashed overlay shown while dragging -->
	{#if dragging}
		<div
			class="pointer-events-none absolute inset-0 border-[3px] border-dashed border-ink"
			aria-hidden="true"
		></div>
	{/if}

	<input
		bind:this={inputEl}
		type="file"
		accept=".json,application/json,text/json"
		class="hidden"
		onchange={onInputChange}
	/>
</div>
