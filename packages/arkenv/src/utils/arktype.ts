import { createRequire } from "node:module";

let _loaded: any;

/**
 * Lazily loads ArkType and @repo/scope together.
 * This is the sole entry point for ArkType in the ArkEnv codebase.
 */
export function loadArkTypeOrThrow() {
	if (_loaded) return _loaded;

	try {
		// Use createRequire to load ArkType synchronously
		const require = createRequire(import.meta.url);
		let arktype = require("arktype");

		// Handle ESM default export wrapper
		if (arktype?.default?.type) {
			arktype = arktype.default;
		}

		// Also load the @repo/scope module which depends on arktype
		const scopeModule = require("@repo/scope");
		const $ = scopeModule.$ || scopeModule.default?.$;

		if (!$) {
			throw new Error("Failed to load @repo/scope");
		}

		_loaded = {
			type: arktype.type,
			scope: arktype.scope,
			ArkErrors: arktype.ArkErrors,
			$,
		};

		return _loaded;
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		throw new Error(
			`ArkType is required but could not be found. (Error: ${message}) Please install 'arktype' or use { validator: 'standard' } in your ArkEnv configuration.`,
		);
	}
}
