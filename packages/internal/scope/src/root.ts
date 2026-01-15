import type { Module, scope, Type, type } from "arktype";
import { host, port } from "./keywords";
import { loadArkType } from "./loader";

let _$: any;

/**
 * The root scope for the ArkEnv library,
 * lazily initialized via a Proxy to allow optional ArkType usage.
 */
export const $ = new Proxy(
	{},
	{
		get(_, prop) {
			if (!_$) {
				const { type: at, scope: s } = loadArkType();
				_$ = s({
					port,
					host,
					string: at.module({ ...at.keywords.string, host }),
					number: at.module({ ...at.keywords.number, port }),
				});
				// Ensure exports are available directly on the scope object
				Object.assign(_$, _$.export());
			}
			return (_$ as any)[prop];
		},
	},
) as unknown as $;

/**
 * The type of the root ArkEnv scope.
 */
export type $ = ReturnType<
	typeof scope<{
		port: Type<number, any>;
		host: Type<string, any>;
		string: Module<{ host: Type<string, any> }>;
		number: Module<{ port: Type<number, any> }>;
	}>
>;
