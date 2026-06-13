import type { InferType } from "@repo/types";

export type { LayoutMode, Logger, ResolvedLayout } from "@arkenv/build-utils";

/**
 * Shared type utilities for Nuxt entry points.
 */

export type UnionToIntersection<U> = (
	U extends any
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

export type ResolveExtendsElement<T> = [InferType<T>] extends [never]
	? T
	: InferType<T>;

export type MergeExtends<TExtends extends readonly unknown[] | undefined> =
	TExtends extends readonly unknown[]
		? UnionToIntersection<ResolveExtendsElement<TExtends[number]>>
		: {};
