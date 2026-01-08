import type { StandardSchemaV1 } from "@standard-schema/spec";
import { createRequire } from "node:module";
import type { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { ArkEnvError } from "./errors";
import { coerce } from "./utils/coerce";
import type { CoerceOptions } from "./utils";

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
 * Internal validation logic for ArkType schemas.
 */
function validateArkType(
	def: unknown,
	config: ArkEnvConfig,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: any[] } {
	try {
		const { $ } = require("@repo/scope");
		const { type } = require("arktype");

		const schemaDef = def as any;
		const isCompiledType =
			(typeof schemaDef === "function" && "assert" in schemaDef) ||
			(typeof schemaDef === "object" &&
				schemaDef !== null &&
				"invoke" in schemaDef);

		let schema = isCompiledType ? schemaDef : $.type(schemaDef);

		// Apply the `onUndeclaredKey` option, defaulting to "delete" for arkenv compatibility
		schema = schema.onUndeclaredKey(config.onUndeclaredKey ?? "delete");

		// Apply coercion transformation (Lazy Loaded)
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
					message: (error as { message: string }).message,
					validator: "arktype" as const,
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
 * Internal validation logic for Standard Schema validators.
 */
function validateStandard(
	def: StandardSchemaV1,
	env: Record<string, string | undefined>,
): { success: true; value: unknown } | { success: false; issues: any[] } {
	const result = def["~standard"].validate(env);

	if (result instanceof Promise) {
		throw new Error("ArkEnv does not support asynchronous validation.");
	}

	if (result.issues) {
		return {
			success: false,
			issues: result.issues.map((issue) => ({
				path: (issue.path as string[]) ?? [],
				message: issue.message,
				validator: "standard" as const,
			})),
		};
	}

	return {
		success: true,
		value: result.value,
	};
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
	const isStandard = !!(def as any)?.["~standard"];
	const isArkCompiled =
		(typeof def === "function" && "assert" in (def as any)) ||
		(typeof def === "object" && def !== null && "invoke" in (def as any));

	const result =
		isStandard && !isArkCompiled
			? validateStandard(def as any, env)
			: validateArkType(def, config, env);

	if (!result.success) {
		throw new ArkEnvError(result.issues);
	}

	return result.value as any;
}

/**
 * The primary entry point for ArkEnv.
 *
 * arkenv({
 *   PORT: "number.port",       // ArkType DSL
 *   HOST: z.string().min(1)    // Standard Schema (Zod)
 * })
 *
 * IMPORTANT: arkenv() expects an object mapping environment keys to validators.
 * Standard Schema validators are supported inside the mapping for migration,
 * but top-level wrapped schemas (like z.object()) are not supported at this entry point.
 *
 * Type inference quality depends on the validator used.
 * ArkType provides the richest inference.
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
	const isStandard = !!(def as any)?.["~standard"];
	const isArkCompiled =
		(typeof def === "function" && "assert" in (def as any)) ||
		(typeof def === "object" && def !== null && "invoke" in (def as any));

	// Guardrail: Block top-level Standard Schema (Zod, Valibot, etc.)
	// Reusable type() schemas (ArkType) are allowed.
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
const createEnv = arkenv;

export { createEnv };
