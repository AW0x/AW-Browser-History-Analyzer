<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { themeStore } from '$stores/theme.svelte';

	function toggle() {
		themeStore.toggle();
	}
</script>

<button
	type="button"
	class="nb-btn bg-accent-2 px-3 py-2"
	onclick={toggle}
	aria-label="Toggle {themeStore.isDark ? 'light' : 'dark'} theme"
	aria-pressed={themeStore.isDark}
	title="Toggle theme"
>
	{#if themeStore.isDark}
		<Sun size={18} strokeWidth={2.5} />
	{:else}
		<Moon size={18} strokeWidth={2.5} />
	{/if}
</button>
