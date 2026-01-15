import type { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { parseArkType } from "./parse-arktype";
import { parseStandard } from "./parse-standard";

export type EnvSchema<def> = at.validate<def, $>;
type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * Configuration options for `createEnv`
 */
export type ArkEnvConfig = {
	/**
	 * The environment variables to parse. Defaults to `process.env`
	 */
	env?: RuntimeEnvironment;
	/**
	 * Whether to coerce environment variables to their defined types. Defaults to `true`
	 */
	coerce?: boolean;
	/**
	 * Control how ArkEnv handles environment variables that are not defined in your schema.
	 *
	 * Defaults to `'delete'` to ensure your output object only contains
	 * keys you've explicitly declared. This differs from ArkType's standard behavior, which
	 * mirrors TypeScript by defaulting to `'ignore'`.
	 *
	 * - `delete` (ArkEnv default): Undeclared keys are allowed on input but stripped from the output.
	 * - `ignore` (ArkType default): Undeclared keys are allowed and preserved in the output.
	 * - `reject`: Undeclared keys will cause validation to fail.
	 *
	 * @default "delete"
	 * @see https://arktype.io/docs/configuration#onundeclaredkey
	 */
	onUndeclaredKey?: "ignore" | "delete" | "reject";

	/**
	 * The format to use for array parsing when coercion is enabled.
	 *
	 * - `comma` (default): Strings are split by comma and trimmed.
	 * - `json`: Strings are parsed as JSON.
	 *
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";
	/**
	 * Choose the validator engine to use.
	 *
	 * - `arktype` (default): Uses ArkType for all validation and coercion.
	 * - `standard`: Uses Standard Schema 1.0 directly for validation. Coercion is not supported in this mode.
	 *
	 * @default "arktype"
	 */
	validator?: "arktype" | "standard";
};

/**
 * TODO: `SchemaShape` is basically `Record<string, unknown>`.
 * If possible, find a better type than "const T extends Record<string, unknown>",
 * and be as close as possible to the type accepted by ArkType's `type`.
 */

/**
 * Utility to parse environment variables using ArkType or Standard Schema
 * @param def - The schema definition
 * @param config - The evaluation configuration
 * @returns The parsed environment variables
 * @throws An {@link ArkEnvError | error} if the environment variables are invalid.
 */
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>>;
export function createEnv<T extends EnvSchemaWithType>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>> | InferType<typeof def>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	const mode = config.validator ?? "arktype";

	if (mode === "standard") {
		return parseStandard(def as Record<string, any>, config) as any;
	}

	return parseArkType(def as any, config) as any;
}
