import { browser } from '$app/environment';
import type { Theme } from '$types';

const STORAGE_KEY = 'cha:theme';

function readInitialTheme(): Theme {
	if (!browser) return 'light';
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'dark' || stored === 'light') return stored;
		const prefersDark =
			window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
		return prefersDark ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

class ThemeStore {
	current = $state<Theme>(readInitialTheme());

	get isDark(): boolean {
		return this.current === 'dark';
	}

	toggle(): void {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}

	set(theme: Theme): void {
		this.current = theme;
		if (browser) {
			try {
				localStorage.setItem(STORAGE_KEY, theme);
			} catch {
				/* storage unavailable — non-fatal */
			}
			document.documentElement.dataset.theme = theme;
		}
	}

	/** React to OS theme changes when the user hasn't picked explicitly. */
	syncSystem(): void {
		if (!browser) return;
		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', (e) => {
				try {
					if (localStorage.getItem(STORAGE_KEY) === null) {
						this.set(e.matches ? 'dark' : 'light');
					}
				} catch {
					/* ignore */
				}
			});
	}
}

export const themeStore = new ThemeStore();
