import type { AppData } from '$types';
import { parseHistoryFile, ImportError } from './import';
import { normalizeEntries } from './group';
import { groupHistory } from './group';
import { computeStats, computeDistribution } from './stats';
import { yieldToEventLoop } from '$utils/async';

/**
 * The full import pipeline:
 *   validate → parse → normalize → group → dedupe → stats.
 *
 * Reports progress via the callback (0..1) and yields to the event loop
 * between phases so the UI can paint the progress bar on very large files.
 *
 * Throws `ImportError` for any validation/parse failure — the caller maps
 * those to user-facing messages.
 */
export async function processHistoryFile(
	file: File,
	onProgress?: (p: number) => void
): Promise<AppData> {
	onProgress?.(0.05);
	const raw = await parseHistoryFile(file);
	await yieldToEventLoop();
	onProgress?.(0.3);

	// Normalize every URL once.
	const entries = normalizeEntries(raw);
	await yieldToEventLoop();
	onProgress?.(0.55);

	// Group + dedupe.
	const groups = groupHistory(entries);
	await yieldToEventLoop();
	onProgress?.(0.8);

	// Stats (headline + distribution).
	const stats = computeStats(entries, groups);
	await yieldToEventLoop();
	const distribution = computeDistribution(entries, groups);
	onProgress?.(1);

	return { entries, groups, stats, distribution };
}

export { ImportError };
export type { AppData };
