import type { scope as ArkScope, type as ArkType } from "arktype";

let _scope: any;

/**
 * Creates the ArkEnv scope using the provided ArkType instance.
 * This is lazily cached after the first call.
 */
export const getScope = (arktype: {
	scope: typeof ArkScope;
	type: typeof ArkType;
}) => {
	if (_scope) return _scope;

	const { type: at, scope } = arktype;

	const maybeNumber = at("unknown").pipe((s: any) => {
		if (typeof s === "number") return s;
		if (typeof s !== "string") return s;
		const trimmed = s.trim();
		if (trimmed === "") return s;
		if (trimmed === "NaN") return Number.NaN;
		const n = Number(trimmed);
		return Number.isNaN(n) ? s : n;
	});

	const maybeBoolean = at("unknown").pipe((s: any) => {
		if (s === "true") return true;
		if (s === "false") return false;
		return s;
	});

	const maybeJson = at("unknown").pipe((s: any) => {
		if (typeof s !== "string") return s;
		const trimmed = s.trim();
		if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
		try {
			return JSON.parse(trimmed);
		} catch {
			return s;
		}
	});

	const port = at("0 <= number.integer <= 65535");
	const host = at("string.ip | 'localhost'");

	_scope = scope({
		maybeNumber,
		maybeBoolean,
		maybeJson,
		port,
		host,
		string: at.module({
			...at.keywords.string,
			host,
		}),
		number: at.module({
			...at.keywords.number,
			port,
		}),
	});

	return _scope;
};

/**
 * Type-only export for $ to be used in type-level validation.
 */
export type $ = any;
