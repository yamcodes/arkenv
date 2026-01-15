import { createRequire } from "node:module";
import type { ArkErrors, scope as ArkScope, type as ArkType } from "arktype";

export type ArkTypeInstance = {
	type: typeof ArkType;
	scope: typeof ArkScope;
	ArkErrors: typeof ArkErrors;
};

let _arktype: ArkTypeInstance | undefined;

/**
 * Lazily loads the ArkType library.
 */
export function loadArkType(): ArkTypeInstance {
	if (_arktype) return _arktype;

	try {
		const require = createRequire(import.meta.url);
		let arktype = require("arktype");

		if (arktype?.default?.type) {
			arktype = arktype.default;
		}

		_arktype = {
			type: arktype.type,
			scope: arktype.scope,
			ArkErrors: arktype.ArkErrors,
		};

		return _arktype;
	} catch (e: any) {
		throw new Error(
			`ArkType is required but not found. (Error: ${e?.message}) Please install 'arktype' or use { validator: 'standard' }.`,
		);
	}
}
