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

	const port = at("0 <= number.integer <= 65535");
	const host = at("string.ip | 'localhost'");

	_scope = scope({
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
