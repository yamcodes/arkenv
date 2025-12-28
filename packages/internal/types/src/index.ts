/**
 * Internal TypeScript/ArkType types shared across ArkEnv packages.
 *
 * This package is not published to npm and is intended for internal use only
 * within the monorepo.
 */

// Only TypeScript types
export type * from "./filter-by-prefix";
export type * from "./infer-type";

// Also includes ArkType types
export * from "./schema";

/**
 * Prettify a type by mapping over its keys to force TypeScript to expand it in tooltips.
 */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
