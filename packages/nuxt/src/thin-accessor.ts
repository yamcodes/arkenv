import { type ArkenvInternalHooks, arkenvInternal } from "./arkenv-internal";
import { assertNotRemovedNestedBag } from "./removed-nested";

/**
 * Dispatch a flat-layout thin `arkenv()` call into {@link arkenvInternal}.
 *
 * Shared by ArkType and Standard flat entries so server hooks and context
 * construction stay unified.
 *
 * @param schema Schema definition
 * @param options Flat options or undefined
 * @param dispatchOptions Optional server hooks (e.g. ensureBootGate)
 * @returns The thin env proxy from {@link arkenvInternal}
 * @throws An error when the removed nested bag API is detected
 */
export function dispatchFlatThinArkenv(
	schema: unknown,
	options: unknown,
	dispatchOptions?: {
		ensureBootGate?: () => void;
	},
): unknown {
	assertNotRemovedNestedBag(schema);

	const isServer = typeof window === "undefined";
	const hooks: ArkenvInternalHooks | undefined =
		isServer && dispatchOptions?.ensureBootGate
			? { ensureBootGate: dispatchOptions.ensureBootGate }
			: undefined;

	return arkenvInternal(
		schema as never,
		options as never,
		{ isServer },
		hooks,
	);
}
