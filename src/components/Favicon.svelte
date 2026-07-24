<script lang="ts">
	import { faviconUrl, faviconPlaceholder } from '$history/normalize';

	let {
		hostname,
		letter = '',
		size = 20,
		class: klass = ''
	}: {
		hostname: string;
		letter?: string;
		size?: number;
		class?: string;
	} = $props();

	let failed = $state(false);
	const src = $derived(
		failed || !hostname ? faviconPlaceholder(letter) : faviconUrl(hostname, Math.max(32, size * 2))
	);
</script>

<img
	{src}
	alt=""
	role="presentation"
	width={size}
	height={size}
	loading="lazy"
	decoding="async"
	class={klass}
	style="width:{size}px;height:{size}px"
	onerror={() => (failed = true)}
/>
