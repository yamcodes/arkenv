import {
	arkenvInternal,
	type ArkenvInternalHooks,
} from "./arkenv-internal";
import { withAutoExtend } from "./auto-extend";

export type ThinStrictLayout = "client" | "server";

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

	const isLegacy =
		schemaOrOptions &&
		typeof schemaOrOptions === "object" &&
		(isServer
			? "runtimeEnv" in schemaOrOptions ||
				"server" in schemaOrOptions ||
				"shared" in schemaOrOptions
			: "client" in schemaOrOptions || "shared" in schemaOrOptions);

	if (isLegacy) {
		if (isServer && "client" in schemaOrOptions) {
			throw new Error(
				"server entry point only accepts 'server' and 'shared' schemas.",
			);
		}
		if (!isServer && "server" in schemaOrOptions) {
			throw new Error(
				"client entry point only accepts 'client' and 'shared' schemas.",
			);
		}
		return arkenvInternal(schemaOrOptions, isServer, undefined, hooks);
	}

	return arkenvInternal(
		schemaOrOptions as never,
		withAutoExtend(
			optionsOrIsServer as never,
			options.resolveAutoExtendTarget,
		),
		{ isServer, strictLayout: options.strictLayout },
		hooks,
	);
}
