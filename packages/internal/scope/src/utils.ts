import type { Type } from "arktype";
import { loadArkType } from "./loader";

/**
 * Creates a lazy-loading ArkType keyword.
 * The keyword definition is only evaluated when first accessed or called.
 *
 * @example
 * ```ts
 * export const port = keyword(({ type }) =>
 *   type("0 <= number.integer <= 65535")
 * );
 *
 * export const email = keyword(({ type }) =>
 *   type("string.email")
 * );
 * ```
 */
export function keyword<const TDef extends Type<any, any>>(
	factory: (context: { type: ReturnType<typeof loadArkType>["type"] }) => TDef,
): TDef {
	let _keyword: TDef | undefined;

	const getKeyword = () => {
		if (!_keyword) {
			const { type } = loadArkType();
			_keyword = factory({ type });
		}
		return _keyword;
	};

	return new Proxy(() => {}, {
		get(_, prop) {
			return getKeyword()[prop as keyof TDef];
		},
		apply(_, _thisArg, args) {
			return (getKeyword() as any)(...args);
		},
	}) as unknown as TDef;
}
