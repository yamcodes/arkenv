/**
 * Shared type utilities for Next.js entry points.
 */

export type UnionToIntersection<U> = (
	U extends any
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

export type MergeExtends<TExtends extends readonly unknown[] | undefined> =
	TExtends extends readonly unknown[]
		? UnionToIntersection<TExtends[number]>
		: {};
