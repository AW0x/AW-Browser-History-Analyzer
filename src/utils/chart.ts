/** Shared helpers for the SVG charts — keep them tiny and dependency-free. */

export interface Point {
	x: number;
	y: number;
	label: string;
	value: number;
}

export interface Series {
	label: string;
	color: string;
	value: number;
}

/** Map a value across a numeric domain into [0, max] pixel space. */
export function scale(
	value: number,
	domain: [number, number],
	range: [number, number]
): number {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	if (d1 === d0) return (r0 + r1) / 2;
	return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/** Build a smooth Catmull-Rom → Bezier path through points. */
export function smoothPath(pts: { x: number; y: number }[]): string {
	if (pts.length === 0) return '';
	if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
	let d = `M ${pts[0].x} ${pts[0].y}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[i - 1] ?? pts[i];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[i + 2] ?? p2;
		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;
		d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
	}
	return d;
}

/** Pick `n` evenly-spaced ticks across [min, max]. */
export function niceTicks(min: number, max: number, n = 4): number[] {
	if (min === max) return [min];
	const step = (max - min) / (n - 1);
	return Array.from({ length: n }, (_, i) => min + i * step);
}

/** Palette used across all charts — matches the design system accents. */
export const CHART_COLORS = [
	'var(--color-accent)',
	'var(--color-accent-2)',
	'var(--color-accent-3)',
	'var(--color-accent-4)',
	'var(--color-accent-5)',
	'var(--color-accent-6)'
];
