import { browser } from '$app/environment';
import type { Toast, ToastKind } from '$types';

const STORAGE_KEY = 'cha:bookmarks';
const FILTER_KEY = 'cha:filters';
const COLLAPSE_KEY = 'cha:collapsed';

let toastId = 0;

class ToastStore {
	items = $state<Toast[]>([]);

	push(message: string, kind: ToastKind = 'info'): void {
		const id = ++toastId;
		this.items = [...this.items, { id, kind, message }];
		// Auto-dismiss after 3.5s
		if (browser) {
			setTimeout(() => this.dismiss(id), 3500);
		}
	}

	dismiss(id: number): void {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toastStore = new ToastStore();

/* ----- Bookmarks (persisted domain list) ----- */

class BookmarkStore {
	domains = $state<Set<string>>(loadBookmarks());

	has(domain: string): boolean {
		return this.domains.has(domain);
	}

	toggle(domain: string): void {
		const next = new Set(this.domains);
		if (next.has(domain)) {
			next.delete(domain);
			toastStore.push(`Removed bookmark: ${domain}`, 'info');
		} else {
			next.add(domain);
			toastStore.push(`Bookmarked: ${domain}`, 'success');
		}
		this.domains = next;
		persistBookmarks(next);
	}
}

export const bookmarkStore = new BookmarkStore();

function loadBookmarks(): Set<string> {
	if (!browser) return new Set();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return new Set();
		const arr: unknown = JSON.parse(raw);
		return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === 'string')) : new Set();
	} catch {
		return new Set();
	}
}

function persistBookmarks(domains: Set<string>): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...domains]));
	} catch {
		/* ignore */
	}
}

/* ----- Filter + sort + collapse persistence ----- */

export function loadPersistedString(key: string, fallback: string): string {
	if (!browser) return fallback;
	try {
		return localStorage.getItem(key) ?? fallback;
	} catch {
		return fallback;
	}
}

export function persistString(key: string, value: string): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, value);
	} catch {
		/* ignore */
	}
}

export const FILTER_STORAGE_KEY = FILTER_KEY;
export const COLLAPSE_STORAGE_KEY = COLLAPSE_KEY;
