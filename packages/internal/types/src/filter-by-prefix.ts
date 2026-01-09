/**
 * Filter environment variables to only include those that start with the given prefix.
 * This ensures only client-exposed variables (e.g., VITE_*, BUN_PUBLIC_*) are included.
 *
 * @template T - The record of environment variables
 * @template Prefix - The prefix to filter by
 */
export type FilterByPrefix<T, Prefix extends string> = T;
