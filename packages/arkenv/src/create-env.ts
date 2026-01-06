import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import type { $ } from "@repo/scope";
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
 * Use this when you have a pre-defined validator (e.g. `z.object({ ... })`)
 * and want zero ArkType DSL behavior.
 *
 * Zero implicit coercion, zero ArkType dependency (unless passed an ArkType schema).
 */
export function defineEnv<T extends EnvSchemaWithType>(
	schema: T,
	config: ArkEnvConfig = {},
): InferType<T> {
	const env = config.env ?? process.env;
	const isStandard = !!(schema as any)?.["~standard"];
	const isArkCompiled =
		typeof schema === "function" && "assert" in (schema as any);

	const adapter =
		isStandard && !isArkCompiled
			? new StandardSchemaAdapter(schema as any)
			: new ArkTypeAdapter(schema, config as any);

	const result = adapter.validate(env);

	if (!result.success) {
		throw new ArkEnvError(result.issues);
	}

	return result.value as InferType<T>;
}

/**
 * Ergonomic, hybrid entry point (migration-friendly).
 * Supports ArkType DSL, Standard Schema validators, or a mix of both.
 *
 * arkenv({
 *   PORT: "number.port",       // ArkType DSL
 *   HOST: z.string().min(1)    // Standard Schema (Zod)
 * })
 *
 * IMPORTANT: arkenv() expects an object mapping environment keys to validators.
 * Do not pass a wrapped schema like arkenv(z.object({ ... })).
 * Use defineEnv() for strict Standard Schema paths.
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
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, $>> | InferType<typeof def>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, $>> | InferType<typeof def> {
	// Guardrail: Ensure arkenv() only accepts an object map.
	// We check for "~standard" (Standard Schema) or "assert" (compiled ArkType)
	// which indicate the user passed a wrapped schema instead of an object map.
	if (
		typeof def === "function" ||
		(def !== null && typeof def === "object" && "~standard" in def)
	) {
		throw new Error(
			"ArkEnv: arkenv() expects a mapping of { KEY: validator }, not a wrapped schema. " +
				"If you want to pass a top-level validator like z.object(), use defineEnv() instead.",
		);
	}

	return defineEnv(def as any, config) as any;
}

/**
 * @deprecated Use `arkenv` or `defineEnv` instead.
 */
export const createEnv = arkenv;
