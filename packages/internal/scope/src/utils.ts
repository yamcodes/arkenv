import type { Type } from "arktype";
import { loadArkType } from "./loader";

/**
 * Creates a lazy-loading proxy for an ArkType keyword.
 * The keyword definition is only evaluated when first accessed or called.
 *
 * @example
 * ```ts
 * export const port = lazyKeyword(() =>
 *   type("0 <= number.integer <= 65535")
 * );
 *
 * // Or with direct access to the loaded type function:
 * export const email = lazyKeyword(({ type }) =>
 *   type("string.email")
 * );
 * ```
 */
export function lazyKeyword<T = any>(
	factory: (context: {
		type: ReturnType<typeof loadArkType>["type"];
	}) => Type<T, any>,
): Type<T, any> {
	let _keyword: Type<T, any> | undefined;

	const getKeyword = () => {
		if (!_keyword) {
			const { type } = loadArkType();
			_keyword = factory({ type });
		}
		return _keyword;
	};

	return new Proxy(() => {}, {
		get(_, prop) {
			return getKeyword()[prop as keyof Type<T, any>];
		},
		apply(_, thisArg, args) {
			return (getKeyword() as any)(...args);
		},
	}) as unknown as Type<T, any>;
}
