import type { FlatSchemaOptions } from "./arkenv-internal";
import { isStrictLayoutActive } from "./strict-client-env";

/**
 * Apply strict-layout auto-extend when `extends` is omitted.
 *
 * Pass the extend target via `resolveExtendTarget` so client entries never
 * import the server-only `#arkenv/client-env` graph (and vice versa).
 *
 * @param optionsOrIsServer Flat options, legacy boolean, or undefined
 * @param resolveExtendTarget Lazy resolver for the default extend target
 * @returns Options with auto-extend applied when appropriate
 */
export function withAutoExtend(
	optionsOrIsServer: FlatSchemaOptions | boolean | null | undefined,
	resolveExtendTarget: () => unknown,
): FlatSchemaOptions | boolean | null | undefined {
	if (typeof optionsOrIsServer === "boolean") {
		return optionsOrIsServer;
	}

	if (optionsOrIsServer != null && "extends" in optionsOrIsServer) {
		return optionsOrIsServer;
	}

	if (!isStrictLayoutActive()) {
		return optionsOrIsServer;
	}

	return {
		...(optionsOrIsServer ?? {}),
		extends: [resolveExtendTarget()],
	};
}
