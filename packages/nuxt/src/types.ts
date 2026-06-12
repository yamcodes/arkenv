import type { InferType } from "@repo/types";

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

export type LayoutMode = "simple" | "strict";

export type ResolvedLayout = {
	layout: LayoutMode;
	baseDir: string;
};

export type Logger = {
	error: (msg: string) => void;
	info?: (msg: string) => void;
};
