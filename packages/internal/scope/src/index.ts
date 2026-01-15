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

	// Note: We use string aliases for port and host so they resolve correctly
	// within the scope when used in the modules.

	_scope = scope({
		maybeNumber: at("unknown").pipe((s: any) => {
			if (typeof s === "number") return s;
			if (typeof s !== "string") return s;
			const trimmed = s.trim();
			if (trimmed === "") return s;
			if (trimmed === "NaN") return Number.NaN;
			const n = Number(trimmed);
			return Number.isNaN(n) ? s : n;
		}),
		maybeBoolean: at("unknown").pipe((s: any) => {
			if (s === "true") return true;
			if (s === "false") return false;
			return s;
		}),
		maybeJson: at("unknown").pipe((s: any) => {
			if (typeof s !== "string") return s;
			const trimmed = s.trim();
			if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return s;
			try {
				return JSON.parse(trimmed);
			} catch {
				return s;
			}
		}),
		port: "0 <= number.integer <= 65535",
		host: "string.ip | 'localhost'",
		string: at.module({
			...at.keywords.string,
			host: "host",
		}),
		number: at.module({
			...at.keywords.number,
			port: "port",
		}),
	});

	return _scope;
};

/**
 * Type-only export for $ to be used in type-level validation.
 */
export type $ = any;
