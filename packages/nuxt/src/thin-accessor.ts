import { type ArkenvInternalHooks, arkenvInternal } from "./arkenv-internal";
import { withAutoExtend } from "./auto-extend";
import { isLegacyNestedSchema } from "./schema-shape";

export type ThinStrictLayout = "client" | "server";

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

/**
 * Dispatch a strict-layout thin `arkenv()` call into {@link arkenvInternal}.
 *
 * Shared by ArkType and Standard client/server entries so legacy detection,
 * entry guards, auto-extend, and boot-gate hooks stay in one place. Callers
 * keep their own type overloads and virtual-module imports.
 *
 * @param schemaOrOptions Schema or nested options object
 * @param optionsOrIsServer Flat options, legacy boolean, or undefined
 * @param options Layout, auto-extend target, and optional boot-gate hook
 * @returns The thin env proxy from {@link arkenvInternal}
 * @throws When a legacy nested schema uses the wrong entry buckets
 */
export function dispatchStrictThinArkenv(
	schemaOrOptions: unknown,
	optionsOrIsServer: unknown,
	options: {
		strictLayout: ThinStrictLayout;
		resolveAutoExtendTarget: () => unknown;
		ensureBootGate?: () => void;
	},
): unknown {
	const isServer = options.strictLayout === "server";
	const hooks: ArkenvInternalHooks | undefined = options.ensureBootGate
		? { ensureBootGate: options.ensureBootGate }
		: undefined;

	const isLegacy = isLegacyNestedSchema(schemaOrOptions, optionsOrIsServer);

	if (isLegacy) {
		if (
			isServer &&
			typeof schemaOrOptions === "object" &&
			schemaOrOptions !== null &&
			"client" in schemaOrOptions
		) {
			throw new Error(
				"server entry point only accepts 'server' and 'shared' schemas.",
			);
		}
		if (
			!isServer &&
			typeof schemaOrOptions === "object" &&
			schemaOrOptions !== null &&
			"server" in schemaOrOptions
		) {
			throw new Error(
				"client entry point only accepts 'client' and 'shared' schemas.",
			);
		}
		return arkenvInternal(schemaOrOptions as never, isServer, undefined, hooks);
	}

	return arkenvInternal(
		schemaOrOptions as never,
		withAutoExtend(optionsOrIsServer as never, options.resolveAutoExtendTarget),
		{ isServer, strictLayout: options.strictLayout },
		hooks,
	);
}
