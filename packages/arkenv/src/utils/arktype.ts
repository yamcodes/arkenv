import {
	$,
	type ArkTypeInstance as BaseInstance,
	loadArkType,
} from "@repo/scope";

export type ArkTypeInstance = BaseInstance & {
	$: typeof $;
};

/**
 * Lazily loads ArkType and its associated scope.
 * This acts as the central entry point for all ArkType-related features in ArkEnv.
 */
export function loadArkTypeOrThrow(): ArkTypeInstance {
	const arktype = loadArkType();

	return {
		...arktype,
		$,
	};
}
