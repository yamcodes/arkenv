import type { Dict } from "@repo/types";
import { applyCoercion, findCoercionPaths, stripEmptyStrings } from "./shared";

/**
 * Prepare an environment record by optionally stripping empty strings and applying coercion.
 *
 * @param env The raw environment variables
 * @param emptyAsUndefined Whether to strip empty string values before processing
 * @param arrayFormat The format to use for array coercion
 * @param getSchema Optional callback that returns a JSON Schema and whether it exists,
 *        used to determine coercion targets. When omitted, no coercion is performed.
 * @returns The processed environment, the coerced environment, and any missing schema keys
 */
export function coerceEnvironment(
	env: Dict<string>,
	emptyAsUndefined: boolean,
	arrayFormat: "comma" | "json",
	getSchema?: () => {
		schema: unknown;
		hasSchema: boolean;
		missingKeys?: string[];
	},
): {
	processedEnv: Dict<string>;
	coercedEnv: Record<string, unknown>;
	missingKeys: string[];
} {
	const processedEnv = emptyAsUndefined ? stripEmptyStrings(env) : env;
	let coercedEnv: Record<string, unknown> = { ...processedEnv };
	const missingKeys: string[] = [];

	if (getSchema) {
		const result = getSchema();
		missingKeys.push(...(result.missingKeys || []));
		if (result.hasSchema) {
			coercedEnv = applyCoercion(coercedEnv, findCoercionPaths(result.schema), {
				arrayFormat,
			}) as Record<string, unknown>;
		}
	}

	return { processedEnv, coercedEnv, missingKeys };
}
