import { createRequire } from "node:module";
import { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { type as at, Type } from "arktype";
import { ArkEnvError, type EnvIssue } from "./errors";
import { coerce } from "./utils/coerce";

const require = createRequire(import.meta.url);

export type EnvSchema<def> = at.validate<def, $>;

/**
 * Configuration options for `createEnv`
 */
export type ArkEnvConfig = {
	/**
	 * The environment variables to validate. Defaults to `process.env`
	 */
	env?: Record<string, string | undefined>;
	/**
	 * Whether to coerce environment variables to their defined types. Defaults to `true`
	 */
	coerce?: boolean;
	/**
	 * How to handle undeclared keys in the schema.
	 * - `delete`: Remove undeclared keys.
	 * - `ignore`: Leave undeclared keys as they are.
	 * - `reject`: Throw an error if undeclared keys are present.
	 * @default "delete"
	 */
	onUndeclaredKey?: "delete" | "ignore" | "reject";
	/**
	 * For arrays, specifies how to parse the string value.
	 * - `comma`: Split by commas and trim whitespace.
	 * - `json`: Strings are parsed as JSON.
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";
};

function detectValidatorType(def: unknown) {
	const isStandard = !!(def as StandardSchemaV1)?.["~standard"];
	const isObjectLike =
		typeof def === "function" || (typeof def === "object" && def !== null);

	if (!isObjectLike) {
		return { isStandard, isArkCompiled: false };
	}

	const d = def as Record<string, unknown>;
	// Check for ArkType's brand/symbol if available, fall back to duck typing
	const hasArktypeBrand =
		"infer" in d || (typeof d.t === "object" && d.t !== null && "infer" in d.t);

	const isArkCompiled =
		hasArktypeBrand ||
		(("t" in d || "allows" in d) &&
			("infer" in d ||
				"toJsonSchema" in d ||
				"expression" in d ||
				("array" in d && "or" in d && "pipe" in d)));

	return { isStandard, isArkCompiled };
}

function validateArkType(
	def: unknown,
	config: ArkEnvConfig,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	try {
		const { type } = require("arktype");

		const { isArkCompiled: isCompiledType } = detectValidatorType(def);

		let schema = isCompiledType
			? (def as Type)
			: ($.type(def as any) as unknown as Type);

		// Apply the `onUndeclaredKey` option, defaulting to "delete" for arkenv compatibility
		schema = schema.onUndeclaredKey(config.onUndeclaredKey ?? "delete");

		// Apply coercion transformation (Lazy Loaded)
		if (config.coerce !== false) {
			schema = coerce(schema, {
				...(config.arrayFormat ? { arrayFormat: config.arrayFormat } : {}),
			});
		}

		const result = schema(env);

		if (result instanceof type.errors) {
			return {
				success: false,
				issues: Object.entries(
					(result as { byPath: Record<string, { message?: string }> }).byPath,
				).map(([path, error]) => ({
					path: path ? path.split(".") : [],
					message:
						typeof error === "object" && error !== null && "message" in error
							? String((error as { message?: string }).message)
							: "Validation failed",
				})),
			};
		}

		return {
			success: true,
			value: result,
		};
	} catch (e: unknown) {
		if (
			e instanceof Error &&
			"code" in e &&
			e.code === "MODULE_NOT_FOUND" &&
			e.message.includes("'arktype'")
		) {
			throw new Error(
				"ArkType is required for this schema type. Please install 'arktype' or use a Standard Schema validator like Zod.",
			);
		}
		throw e;
	}
}

/**
 * Validate and distill environment variables based on a schema.
 *
 * @param def - The environment variable schema definition. Can be a mapping of keys to validators,
 * or a compiled ArkType schema.
 * @param config - Optional configuration for validation and coercion.
 * @returns The validated and distilled environment variables.
 * @throws {ArkEnvError} If validation fails.
 */
export function createEnv<const T extends SchemaShape>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function createEnv<const T extends EnvSchemaWithType>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function createEnv<T extends SchemaShape | EnvSchemaWithType>(
	def: T,
	config: ArkEnvConfig = {},
): InferType<T> {
	const { env = process.env } = config;

	const { isStandard, isArkCompiled } = detectValidatorType(def);

	// Guardrail: Block top-level Standard Schema (Zod, Valibot, etc.)
	// Reusable type() schemas (ArkType) are allowed.
	if (isStandard && !isArkCompiled) {
		throw new Error(
			"ArkEnv: arkenv() expects a mapping of { KEY: validator }, not a top-level Standard Schema (e.g. z.object()). " +
				"Standard Schema validators are supported inside the mapping, or you can use ArkType's type() for top-level schemas.",
		);
	}

	const result = validateArkType(def, config, env);

	if (!result.success) {
		throw new ArkEnvError(result.issues);
	}

	return result.value as InferType<T>;
}
