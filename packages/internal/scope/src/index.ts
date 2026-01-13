import type { scope as ArkScope, type as ArkType } from "arktype";
import { host, port } from "./keywords";

export * from "./keywords";
export { lazyType } from "./lazy-type";

let _$: any;

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
			if (!_$) {
				// We don't use require("arktype") statically to avoid load-time errors
				try {
					const { scope, type } = require("arktype") as {
						scope: typeof ArkScope;
						type: typeof ArkType;
					};

					_$ = scope({
						string: type.module({
							...type.keywords.string,
							host,
						}),
						number: type.module({
							...type.keywords.number,
							port,
						}),
					});
				} catch {
					throw new Error(
						"ArkType is required when using `type()` or ArkType-specific schemas. Please install `arktype`.",
					);
				}
			}
			return (_$ as any)[prop];
		},
	},
) as any;

export type $ = ArkEnvScope["t"];
