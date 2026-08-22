import { normalizePrefixes } from "./env-module-path";

/**
 * Filter an environment object by prefixes and optional explicitly allowed keys.
 *
 * @param env The raw or validated environment object
 * @param prefixes One or more prefix strings (e.g. `["VITE_"]` or `"BUN_PUBLIC_"`)
 * @param allowedKeys Optional set or list of exact key names to preserve regardless of prefix (e.g. `["NODE_ENV"]`)
 * @returns A filtered record containing only matching keys
 */
export function filterEnvByPrefix(
	env: Record<string, unknown>,
	prefixes: string | string[],
	allowedKeys?: string[] | Set<string>,
): Record<string, unknown> {
	const normalizedPrefixes = normalizePrefixes(prefixes);
	const allowedSet =
		allowedKeys instanceof Set ? allowedKeys : new Set(allowedKeys ?? []);

	return Object.fromEntries(
		Object.entries(env).filter(
			([key]) =>
				allowedSet.has(key) ||
				normalizedPrefixes.some((prefix) => key.startsWith(prefix)),
		),
	);
}
