import type { $ } from "@repo/scope";
import type { SchemaShape } from "@repo/types";
import type { EnvSchema } from "arkenv";
import type { type as at, distill } from "arktype";
import { createEnvInternal } from "./create-env";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;
type MergeExtends<TExtends extends readonly unknown[] | undefined> =
	TExtends extends readonly unknown[]
		? UnionToIntersection<TExtends[number]>
		: {};

/**
 * Create a validated, type-safe environment configuration for Next.js applications (Client entry point).
 */
export function createEnv<
	const TClient extends SchemaShape = {},
	const TShared extends SchemaShape = {},
	const TExtends extends readonly unknown[] = [],
>(options: {
	client?: EnvSchema<TClient> & {
		[K in keyof TClient]: K extends `NEXT_PUBLIC_${string}` ? unknown : never;
	};
	shared?: EnvSchema<TShared>;
	extends?: [...TExtends];
	runtimeEnv: Record<keyof TClient | keyof TShared, unknown> &
		Record<string, unknown>;
}): Readonly<
	distill.Out<at.infer<TClient & TShared, $>> & MergeExtends<TExtends>
> {
	if ("server" in options) {
		throw new Error(
			"client entry point only accepts 'client' and 'shared' schemas.",
		);
	}
	type ReturnType = Readonly<
		distill.Out<at.infer<TClient & TShared, $>> & MergeExtends<TExtends>
	>;
	return createEnvInternal(options as any, false) as ReturnType;
}

export { type } from "arkenv";

const arkenv = createEnv;
export default arkenv;
