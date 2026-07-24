<script lang="ts">
	import { CheckCircle2, XCircle, Info, X } from 'lucide-svelte';
	import { toastStore } from '$stores/ui.svelte';
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
	aria-live="polite"
	aria-atomic="true"
>
	{#each toastStore.items as toast (toast.id)}
		<div
			class="nb-card pointer-events-auto flex items-center gap-3 px-4 py-2.5 text-sm font-bold shadow-brutal-sm"
			class:bg-accent-3={toast.kind === 'success'}
			class:bg-accent-5={toast.kind === 'error'}
			class:bg-accent-2={toast.kind === 'info'}
			role="status"
		>
			{#if toast.kind === 'success'}
				<CheckCircle2 size={18} strokeWidth={2.75} />
			{:else if toast.kind === 'error'}
				<XCircle size={18} strokeWidth={2.75} class="text-paper" />
			{:else}
				<Info size={18} strokeWidth={2.75} />
			{/if}
			<span class="max-w-xs truncate sm:max-w-md">{toast.message}</span>
			<button
				type="button"
				class="ml-2 shrink-0 opacity-70 hover:opacity-100"
				onclick={() => toastStore.dismiss(toast.id)}
				aria-label="Dismiss notification"
			>
				<X size={14} strokeWidth={2.75} />
			</button>
		</div>
	{/each}
</div>
