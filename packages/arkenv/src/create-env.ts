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
type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * Configuration options for ArkEnv
 */
export type ArkEnvConfig = {
	/**
	 * The environment variables to validate. Defaults to `process.env`
	 */
	env?: RuntimeEnvironment;
	/**
	 * Whether to coerce environment variables to their defined types.
	 * Only supported for ArkType schemas.
	 * @default true
	 */
	coerce?: boolean;
	/**
	 * Control how ArkEnv handles undeclared keys.
	 * Only supported for ArkType schemas.
	 * @default "delete"
	 */
	onUndeclaredKey?: "ignore" | "delete" | "reject";
	/**
	 * The format to use for array parsing in ArkType schemas.
	 * @default "comma"
	 */
	arrayFormat?: CoerceOptions["arrayFormat"];
};

/**
 * Detects the type of validator being used.
 */
function detectValidatorType(def: unknown) {
	const isStandard = !!(def as any)?.["~standard"];
	const isArkCompiled =
		(typeof def === "function" && "assert" in (def as any)) ||
		(typeof def === "object" && def !== null && "invoke" in (def as any));
	return { isStandard, isArkCompiled };
}

/**
 * Internal validation logic for ArkType schemas.
 */
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

		schema = schema.onUndeclaredKey(config.onUndeclaredKey ?? "delete");

		if (config.coerce !== false) {
			schema = coerce(type, schema, {
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
					validator: "arktype" as const,
				})),
			};
		}

		return { success: true, value: result };
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
 * Internal validation logic for Standard Schema validators.
 */
function validateStandard(
	def: StandardSchemaV1,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: EnvIssue[] } {
	const result = def["~standard"].validate(env);

	if (result instanceof Promise)
		throw new Error("ArkEnv does not support asynchronous validation.");

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
				validator: "standard" as const,
			})),
		};
	}

	return { success: true, value: result.value };
}

/**
 * Internal entry point for validation.
 * @internal
 */
function defineEnv<T extends EnvSchemaWithType>(
	def: T,
	config: ArkEnvConfig = {},
): InferType<T> {
	const env = config.env ?? process.env;
	const { isStandard, isArkCompiled } = detectValidatorType(def);

	const result =
		isStandard && !isArkCompiled
			? validateStandard(def as any, env)
			: validateArkType(def, config, env);

	if (!result.success) throw new ArkEnvError(result.issues);
	return result.value as any;
}

/**
 * The primary entry point for ArkEnv.
 */
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>>;
export function arkenv<T extends EnvSchemaWithType>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	const { isStandard, isArkCompiled } = detectValidatorType(def);

	if (isStandard && !isArkCompiled) {
		throw new Error(
			"ArkEnv: arkenv() expects a mapping of { KEY: validator }, not a top-level Standard Schema (e.g. z.object()). " +
				"Standard Schema validators are supported inside the mapping, or you can use ArkType's type() for top-level schemas.",
		);
	}

	return defineEnv(def as any, config) as any;
}

/**
 * @deprecated Use `arkenv` instead.
 */
export const createEnv = arkenv;
