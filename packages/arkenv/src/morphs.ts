/**
 * A loose numeric morph function (internal use only).
 */
export const maybeNumberFn = (s: unknown) => {
	if (typeof s === "number") return s;
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (trimmed === "") return s;
	if (trimmed === "NaN") return Number.NaN;
	const n = Number(trimmed);
	return Number.isNaN(n) ? s : n;
};

/**
 * A loose boolean morph function (internal use only).
 */
export const maybeBooleanFn = (s: unknown) => {
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
};

/**
 * A loose JSON morph function (internal use only).
 */
export const maybeJsonFn = (s: unknown) => {
	if (typeof s !== "string") return s;
	const trimmed = s.trim();
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
	try {
		return JSON.parse(trimmed);
	} catch {
		return s;
	}
};
