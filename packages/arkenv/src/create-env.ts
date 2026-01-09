import { createRequire } from "node:module";
import type { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { type as at, distill } from "arktype";
import { ArkEnvError, type EnvIssue } from "./errors";
import type { CoerceOptions } from "./utils";
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
	arrayFormat?: CoerceOptions["arrayFormat"];
};

function detectValidatorType(def: unknown) {
	const isStandard = !!(def as any)?.["~standard"];
	const isArkCompiled =
		(typeof def === "function" && "assert" in (def as any)) ||
		(typeof def === "object" && def !== null && "invoke" in (def as any));
	return { isStandard, isArkCompiled };
}

function validateStandard(
	def: StandardSchemaV1,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	const result = def["~standard"].validate(env);

	if (result instanceof Promise) {
		throw new Error("ArkEnv does not support asynchronous validation.");
	}

	if (result.issues) {
		return {
			success: false,
			issues: result.issues.map((issue) => ({
				path:
					issue.path?.map((segment: unknown) => {
						if (typeof segment === "string") return segment;
						if (typeof segment === "number") return String(segment);
						if (typeof segment === "symbol") return segment.toString();
						if (
							typeof segment === "object" &&
							segment !== null &&
							"key" in segment
						) {
							return String((segment as { key: unknown }).key);
						}
						return String(segment);
					}) ?? [],
				message: issue.message,
			})),
		};
	}

	return {
		success: true,
		value: result.value,
	};
}

function validateArkType(
	def: unknown,
	config: ArkEnvConfig,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	try {
		const { $ } = require("@repo/scope");
		const { type } = require("arktype");

		const { isArkCompiled: isCompiledType } = detectValidatorType(def);

		let schema = isCompiledType ? (def as any) : ($.type(def) as any);

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
				issues: Object.entries(result.byPath).map(([path, error]) => ({
					path: path ? path.split(".") : [],
					message:
						typeof error === "object" && error !== null && "message" in error
							? String((error as any).message)
							: "Validation failed",
				})),
			};
		}

		return {
			success: true,
			value: result,
		};
	} catch (e: any) {
		if (e.code === "MODULE_NOT_FOUND") {
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
	def: at.validate<T, $>,
	config?: ArkEnvConfig,
): InferType<T>;
export function createEnv<const T extends EnvSchemaWithType>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function createEnv(def: any, config: ArkEnvConfig = {}): any {
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

	const result =
		isStandard && !isArkCompiled
			? validateStandard(def as any, env)
			: validateArkType(def, config, env);

	if (!result.success) {
		throw new ArkEnvError(result.issues);
	}

	return result.value as any;
}
