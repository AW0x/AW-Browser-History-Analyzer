/** Debounce a function by `wait` ms. Returns a cancelable handle. */
export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	wait = 200
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const debounced = (...args: Parameters<T>) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => fn(...args), wait);
	};
	debounced.cancel = () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};
	return debounced;
}

/** A promise that resolves after `ms`. Useful for yielding to the event loop. */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Yield to the event loop so the UI thread can paint during long synchronous
 * work. Call this inside tight loops that process large datasets.
 */
export function yieldToEventLoop(): Promise<void> {
	// MessageChannel is faster than setTimeout(0) and doesn't clamp to 4ms.
	return new Promise((resolve) => {
		const ch = new MessageChannel();
		ch.port1.onmessage = () => resolve();
		ch.port2.postMessage(null);
	});
}
