import type { RawHistoryItem } from '$types';

export type ImportErrorCode =
	| 'wrong-type'
	| 'empty-file'
	| 'invalid-json'
	| 'unknown-schema'
	| 'missing-fields'
	| 'too-large';

export class ImportError extends Error {
	readonly code: ImportErrorCode;
	constructor(code: ImportErrorCode, message: string) {
		super(message);
		this.name = 'ImportError';
		this.code = code;
	}
}

/** Friendly user-facing messages per error code. */
const ERROR_MESSAGES: Record<ImportErrorCode, string> = {
	'wrong-type': 'Please drop a .json file exported by Quick Chrome History Export.',
	'empty-file': 'The file is empty. Export your history and try again.',
	'invalid-json': 'The file is not valid JSON. It may be corrupted — re-export it.',
	'unknown-schema': 'This JSON does not look like a Chrome history export.',
	'missing-fields': 'Some history entries are missing required fields (url, visitTime).',
	'too-large': 'The file is too large to process reliably in the browser.'
};

export function describeError(code: ImportErrorCode): string {
	return ERROR_MESSAGES[code];
}

/** ~50 MB hard cap — beyond this the browser tab risks crashing. */
const MAX_FILE_BYTES = 50 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = ['.json'];
const ACCEPTED_MIME = ['application/json', 'text/json', 'text/plain'];

export function validateFile(file: File): void {
	if (file.size === 0) {
		throw new ImportError('empty-file', describeError('empty-file'));
	}
	if (file.size > MAX_FILE_BYTES) {
		throw new ImportError('too-large', describeError('too-large'));
	}
	const name = file.name.toLowerCase();
	const hasJsonExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
	const hasJsonMime = ACCEPTED_MIME.includes(file.type) || file.type === '';
	if (!hasJsonExt && !hasJsonMime) {
		throw new ImportError('wrong-type', describeError('wrong-type'));
	}
}

/**
 * Validate the parsed JSON structure against the expected schema.
 * Accepts both a bare array and `{ history: [...] }` shapes the Browser History Exporter
 * has used across versions.
 */
export function validateSchema(parsed: unknown): RawHistoryItem[] {
	if (!Array.isArray(parsed)) {
		// Accept the wrapper form `{ history: [...] }`.
		if (
			parsed &&
			typeof parsed === 'object' &&
			Array.isArray((parsed as { history?: unknown }).history)
		) {
			return validateSchema((parsed as { history: unknown }).history);
		}
		throw new ImportError('unknown-schema', describeError('unknown-schema'));
	}
	if (parsed.length === 0) {
		throw new ImportError('empty-file', describeError('empty-file'));
	}

	const items = parsed as unknown[];
	const cleaned: RawHistoryItem[] = [];
	let missingCount = 0;

	for (const raw of items) {
		if (!raw || typeof raw !== 'object') {
			missingCount++;
			continue;
		}
		const r = raw as Record<string, unknown>;
		const url = r.url;
		const visitTime = r.visitTime;
		if (typeof url !== 'string' || typeof visitTime !== 'number') {
			missingCount++;
			continue;
		}
		cleaned.push({
			id: typeof r.id === 'string' ? r.id : `${url}|${visitTime}`,
			history_id: typeof r.history_id === 'string' ? r.history_id : undefined,
			title: typeof r.title === 'string' ? r.title : '',
			url,
			visitTime,
			visitCount: typeof r.visitCount === 'number' ? r.visitCount : 0,
			typedCount: typeof r.typedCount === 'number' ? r.typedCount : 0,
			transition: typeof r.transition === 'string' ? r.transition : 'link',
			isLocal: typeof r.isLocal === 'boolean' ? r.isLocal : false
		});
	}

	// If more than 20% of entries were malformed, treat as wrong schema entirely.
	if (cleaned.length === 0 || missingCount > cleaned.length) {
		throw new ImportError('missing-fields', describeError('missing-fields'));
	}
	return cleaned;
}

/** Read a File as UTF-8 text with size guard. */
export function readFileText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () =>
			reject(new ImportError('invalid-json', 'Could not read the file from disk.'));
		reader.onload = () => resolve(String(reader.result ?? ''));
		reader.readAsText(file);
	});
}

/** Parse + validate in one step. Throws ImportError on any failure. */
export async function parseHistoryFile(file: File): Promise<RawHistoryItem[]> {
	validateFile(file);
	const text = await readFileText(file);
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new ImportError('invalid-json', `${describeError('invalid-json')} (${msg})`);
	}
	return validateSchema(parsed);
}
