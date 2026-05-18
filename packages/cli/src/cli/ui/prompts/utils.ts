import { isCancel } from "@clack/prompts";

/**
 * Narrow a Clack group result to its successful (non-null) values.
 */
export function isSuccess<T extends Record<string, any>>(
	result: T | symbol,
): result is { [K in keyof T]: Exclude<T[K], null> } {
	return !isCancel(result) && Object.values(result).every((v) => v !== null);
}
