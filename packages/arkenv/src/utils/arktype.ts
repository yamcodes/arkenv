import { createRequire } from "node:module";

import { getScope } from "@repo/scope";

let _arktype: unknown;

/**
 * Lazily loads ArkType and throws a clear error if it is not installed.
 * This is the sole entry point for ArkType in the ArkEnv codebase.
 */
export function loadArkTypeOrThrow() {
	if (_arktype) return _arktype as any;

	try {
		// Use createRequire to attempt a synchronous load of ArkType.
		// This works in Node.js and Bun environments even when the package is ESM.
		const require = createRequire(import.meta.url);
		let arktype = require("arktype");

		// Handle the case where the module is returned as { default: ... }
		if (
			arktype &&
			typeof arktype === "object" &&
			"default" in arktype &&
			typeof arktype.default === "object" &&
			"type" in arktype.default
		) {
			arktype = arktype.default;
		}

		const $ = getScope(arktype);

		_arktype = {
			type: arktype.type,
			scope: arktype.scope,
			ArkErrors: arktype.ArkErrors,
			$: Object.assign($, $.export()),
		};

		return _arktype as any;
	} catch (e: any) {
		throw new Error(
			`ArkType is required but could not be found. (Error: ${e?.message}) Please install 'arktype' or use { validator: 'standard' } in your ArkEnv configuration.`,
		);
	}
}
