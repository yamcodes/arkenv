import { type ArkenvInternalHooks, arkenvInternal } from "./arkenv-internal";
import { isLegacyNestedSchema } from "./schema-shape";

/**
 * Dispatch a flat-layout thin `arkenv()` call into {@link arkenvInternal}.
 *
 * Shared by ArkType and Standard flat entries so legacy detection, server hooks,
 * and context construction stay unified.
 *
 * @param schemaOrOptions Schema or nested options object
 * @param optionsOrIsServer Flat options, legacy boolean, or undefined
 * @param options Optional server hooks (e.g. ensureBootGate)
 * @returns The thin env proxy from {@link arkenvInternal}
 */
export function dispatchFlatThinArkenv(
	schemaOrOptions: unknown,
	optionsOrIsServer: unknown,
	options?: {
		ensureBootGate?: () => void;
	},
): unknown {
	const isServer = typeof window === "undefined";
	const hooks: ArkenvInternalHooks | undefined =
		isServer && options?.ensureBootGate
			? { ensureBootGate: options.ensureBootGate }
			: undefined;

	const isLegacy = isLegacyNestedSchema(schemaOrOptions, optionsOrIsServer);
	if (isLegacy) {
		return arkenvInternal(schemaOrOptions as never, isServer, undefined, hooks);
	}

	return arkenvInternal(
		schemaOrOptions as never,
		optionsOrIsServer as never,
		{ isServer },
		hooks,
	);
}
