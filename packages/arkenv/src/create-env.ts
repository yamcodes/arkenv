import { createRequire } from "node:module";
import { $ } from "@repo/scope";
import type {
	EnvSchemaWithType,
	InferType,
	SchemaShape,
	StandardSchemaV1,
} from "@repo/types";
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
	 * Whether to coerce environment variables to their defined types.
	 *
	 * @default true
	 * Note: Only takes effect when using ArkType.
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
	 * For arrays, specify how to coerce the string value.
	 * - `comma`: Split by commas and trim whitespace.
	 * - `json`: Strings are coerced as JSON.
	 *
	 * Note: only takes effect when `coerce` is enabled.
	 * @default "comma"
	 */
	arrayFormat?: "comma" | "json";
};

/**
 * Helper to identify if a value is an ArkType-compiled type or a lazy proxy.
 * We want these to go through the validateArkType path for coercion.
 */
function isArktype(def: unknown): boolean {
	if (typeof def !== "function" && (typeof def !== "object" || def === null)) {
		return false;
	}

	const d = def as Record<string, unknown>;

	// Check for ArkType's brand or our lazy proxy state
	return (
		"infer" in d ||
		(typeof d.t === "object" && d.t !== null && "infer" in d.t) ||
		(typeof d.allows === "function" && "pipe" in d)
	);
}

function detectValidatorType(def: unknown) {
	const isStandard = !!(def as StandardSchemaV1)?.["~standard"];
	const isArkCompiled = isArktype(def);

	return { isStandard, isArkCompiled };
}

function validateArkType(
	def: unknown,
	config: ArkEnvConfig,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	try {
		const { isArkCompiled: isCompiledType } = detectValidatorType(def);

		let schema = isCompiledType
			? (def as Type)
			: ($.type(def as any) as unknown as Type);

		// Apply the `onUndeclaredKey` option, defaulting to "delete" for arkenv compatibility
		schema = schema.onUndeclaredKey(config.onUndeclaredKey ?? "delete");

		// Apply coercion transformation (Lazy Loaded)
		if (config.coerce !== false) {
			schema = coerce(schema, {
				arrayFormat: config.arrayFormat,
			});
		}

		const result = schema(env);

		if (result instanceof ($.type as any).errors) {
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
 * Validate a mapping of Standard Schema validators (e.g., Zod)
 * without requiring ArkType.
 */
function validateStandardSchemaMapping(
	def: SchemaShape,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	const result: Record<string, unknown> = {};
	const issues: EnvIssue[] = [];

	for (const [key, validator] of Object.entries(def)) {
		const value = env[key];
		const standardSchema = (validator as StandardSchemaV1)?.["~standard"];

		if (!standardSchema) {
			issues.push({
				path: [key],
				message: `Validator for ${key} is not a Standard Schema validator`,
			});
			continue;
		}

		const validationResult = standardSchema.validate(value);

		// Standard Schema can return Promise or sync result
		// For now, we only support sync validation
		if (validationResult instanceof Promise) {
			issues.push({
				path: [key],
				message: `Async validation is not supported for ${key}`,
			});
			continue;
		}

		if (validationResult.issues) {
			for (const issue of validationResult.issues) {
				issues.push({
					path: [key, ...(issue.path || []).map(String)],
					message: issue.message || "Validation failed",
				});
			}
		} else {
			result[key] = validationResult.value;
		}
	}

	if (issues.length > 0) {
		return { success: false, issues };
	}

	return { success: true, value: result };
}

/**
 * Detect what type of mapping we have
 */
function detectMappingType(
	def: SchemaShape,
): { type: "standard-schema" } | { type: "arktype" } {
	let hasStandardSchema = false;
	let hasArktype = false;

	for (const validator of Object.values(def)) {
		if (isArktype(validator)) {
			hasArktype = true;
		} else if ((validator as StandardSchemaV1)?.["~standard"]) {
			hasStandardSchema = true;
		} else {
			// If it's a string definition or something else, it's ArkType-path
			hasArktype = true;
		}
	}

	// If all validators are ONLY Standard Schema (and NOT ArkType), use Standard Schema path
	// This ensures that ArkType types (which implement Standard Schema) still go through validateArkType
	if (hasStandardSchema && !hasArktype) {
		return { type: "standard-schema" };
	}

	// Otherwise, fallback to ArkType path
	return { type: "arktype" };
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

	// Detect what type of mapping we have and route to the appropriate validator
	const mappingType = detectMappingType(def as SchemaShape);

	const result =
		mappingType.type === "standard-schema"
			? validateStandardSchemaMapping(def as SchemaShape, env)
			: validateArkType(def, config, env);

	if (!result.success) {
		throw new ArkEnvError(result.issues);
	}

	return result.value as InferType<T>;
}
