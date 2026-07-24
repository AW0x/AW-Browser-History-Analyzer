/**
 * Date formatting helpers — all in UTC to match Chrome's `visitTime` semantics
 * and the spec's "Most Active Day (UTC)" / "Most Active Hour (UTC)" requirements.
 */
import { format } from 'date-fns';

/** "2024-03-14" — stable UTC day key for bucketing. */
export function utcDayKey(ts: number): string {
	return format(new Date(ts), 'yyyy-MM-dd');
}

/** Full UTC timestamp: "2024-03-14 09:42". */
export function formatUtc(ts: number, withTime = true): string {
	const d = new Date(ts);
	return format(d, withTime ? "yyyy-MM-dd HH:mm 'UTC'" : 'yyyy-MM-dd');
}

/** Relative "2h ago" style, but falls back to absolute date for older. */
export function formatRelative(ts: number): string {
	const now = Date.now();
	const diff = now - ts;
	const sec = Math.round(diff / 1000);
	const min = Math.round(sec / 60);
	const hr = Math.round(min / 60);
	const day = Math.round(hr / 24);

	if (sec < 60) return 'just now';
	if (min < 60) return `${min}m ago`;
	if (hr < 24) return `${hr}h ago`;
	if (day < 7) return `${day}d ago`;
	return formatUtc(ts, false);
}

export function formatHour(h: number): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(h)}:00`;
}

export function dayLabel(key: string): string {
	// key is yyyy-MM-dd; render as "Mar 14"
	const [, m, d] = key.split('-').map(Number);
	const date = new Date(Date.UTC(2000, m - 1, d));
	return format(date, 'MMM dd');
}
