/**
 * Filter environment variables to only include those that start with the given prefix,
 * or are explicitly listed in the AllowedKeys union.
 * This ensures only client-exposed variables (e.g., VITE_*, BUN_PUBLIC_*) are included.
 *
 * @template T - The record of environment variables
 * @template Prefix - The prefix to filter by
 * @template AllowedKeys - Additional keys to include regardless of prefix (defaults to never)
 */
export type FilterByPrefix<
	T extends Record<string, unknown>,
	Prefix extends string,
	AllowedKeys extends string = never,
> = {
	[K in keyof T as K extends `${Prefix}${string}` | AllowedKeys
		? K
		: never]: T[K];
};
