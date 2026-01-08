import type { $ } from "@repo/scope";
import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { ArkTypeAdapter } from "./adapters/arktype";
import { StandardSchemaAdapter } from "./adapters/standard";
import { ArkEnvError } from "./errors";
import type { CoerceOptions } from "./utils";

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
 * Strict Standard Schema entry point.
 * @private - Supporting internal modules and plugins that import pre-defined validators.
 */
export function defineEnv<T extends EnvSchemaWithType>(
	def: T,
	config: ArkEnvConfig = {},
): InferType<T> {
	const env = config.env ?? process.env;
	const isStandard = !!(def as any)?.["~standard"];
	const isArkCompiled = typeof def === "function" && "assert" in (def as any);

	const adapter =
		isStandard && !isArkCompiled
			? new StandardSchemaAdapter(def as any)
			: new ArkTypeAdapter(def, config as any);

	const result = adapter.validate(env);

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
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> {
	// Guardrail: Ensure arkenv() only accepts an object map.
	// We check for "~standard" (Standard Schema) or "assert" (compiled ArkType)
	// which indicate the user passed a wrapped schema instead of an object map.
	if (
		typeof def === "function" ||
		(def !== null && typeof def === "object" && "~standard" in def)
	) {
		throw new Error(
			"ArkEnv: arkenv() expects a mapping of { KEY: validator }, not a wrapped schema. " +
				"Standard Schema validators are supported inside the mapping for migration, but not as the top-level argument.",
		);
	}

	return defineEnv(def as any, config);
}

/**
 * @deprecated Use `arkenv` instead.
 */
export const createEnv = arkenv;
