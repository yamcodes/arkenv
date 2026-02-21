import type { $ } from "@repo/scope";
import type {
	CompiledEnvSchema,
	Dict,
	InferType,
	SchemaShape,
	StandardSchemaV1,
} from "@repo/types";
import type { type as at, distill } from "arktype";
import { parse } from "./arktype";
import { ArkEnvError } from "./errors";
import { assertNotArkTypeDsl, assertStandardSchema } from "./guards";
import { parseStandard } from "./parse-standard";

/**
 * Declarative environment schema definition accepted by ArkEnv.
 *
 * Represents a declarative schema object mapping environment
 * variable names to schema definitions (e.g. ArkType DSL strings
 * or Standard Schema validators).
 *
 * This type is used to validate that a schema object is compatible with
 * ArkEnv’s validator scope before being compiled or parsed.
 *
 * Most users will provide schemas in this form.
 *
 * @template def - The schema shape object
 */
export type EnvSchema<def> = at.validate<def, $>;
type RuntimeEnvironment = Dict<string>;

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
	config?: Omit<ArkEnvConfig, "validator"> & { validator?: "arktype" },
): distill.Out<at.infer<T, $>>;
export function createEnv<T extends CompiledEnvSchema>(
	def: T,
	config?: Omit<ArkEnvConfig, "validator"> & { validator?: "arktype" },
): InferType<T>;
export function createEnv<const T extends Record<string, StandardSchemaV1>>(
	def: T,
	config: ArkEnvConfig & { validator: "standard" },
): { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> };
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | CompiledEnvSchema,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>> | InferType<typeof def>;
export function createEnv<const T extends SchemaShape>(
	def: EnvSchema<T> | CompiledEnvSchema,
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	const mode = config.validator ?? "arktype";

	if (mode === "standard") {
		// Runtime guard: reject ArkType values in standard mode
		if (!def || typeof def !== "object" || Array.isArray(def)) {
			throw new ArkEnvError([
				{
					path: "",
					message:
						'Invalid schema: expected an object mapping in "standard" mode.',
				},
			]);
		}

		// Check each entry to ensure it's a Standard Schema validator
		for (const key in def) {
			const validator = (def as Record<string, unknown>)[key];
			assertNotArkTypeDsl(key, validator);
			assertStandardSchema(key, validator);
		}

		return parseStandard(def as Record<string, unknown>, config);
	}

	return parse(def, config);
}
