import { host, port } from "./keywords";
import { arktypeLoader } from "./lazy-type";

export * from "./keywords";
export { arktypeLoader, lazyType } from "./lazy-type";

/**
 * Global cache for the realized scope using Symbol.for for cross-module coordination.
 */
const SCOPE_CACHE_SYMBOL = Symbol.for("__ARKENV_SCOPE_CACHE__");
const G = globalThis as any;
G[SCOPE_CACHE_SYMBOL] ??= { scope: undefined };

/**
 * Reset the realized scope and loader (for tests).
 */
export function resetScope() {
	G[SCOPE_CACHE_SYMBOL].scope = undefined;
	arktypeLoader.reset();
}

/**
 * The root scope for the ArkEnv library,
 * containing extensions to the ArkType scopes with ArkEnv-specific types
 * like `string.host` and `number.port`.
 *
 * This is a lazy-loaded proxy to allow ArkType to be an optional dependency.
 */
import type { ArkEnvScope } from "./scope-def";

export type { ArkEnvScope } from "./scope-def";

export const $: ArkEnvScope = new Proxy(
	{},
	{
		get(_, prop) {
			if (!G[SCOPE_CACHE_SYMBOL].scope) {
				const { scope, type } = arktypeLoader.load();

				G[SCOPE_CACHE_SYMBOL].scope = scope({
					string: type.module({
						...type.keywords.string,
						host,
					}),
					number: type.module({
						...type.keywords.number,
						port,
					}),
				});
			}
			return (G[SCOPE_CACHE_SYMBOL].scope as any)[prop];
		},
	},
) as any;

export type $ = ArkEnvScope["t"];
