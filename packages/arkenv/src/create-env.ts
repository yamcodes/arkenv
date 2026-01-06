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
 * The primary entry point for ArkEnv.
 * Supports ArkType DSL, Standard Schema validators, or a mix of both.
 *
 * arkenv({
 *   PORT: "number.port",       // ArkType DSL
 *   HOST: z.string().min(1)    // Standard Schema (Zod)
 * })
 *
 * Or pass a pre-defined validator:
 * arkenv(z.object({ PORT: z.coerce.number() }))
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
 * @private - Internal helper to maintain compatibility while refactoring.
 */
export const defineEnv = arkenv;

/**
 * @deprecated Use `arkenv` or `defineEnv` instead.
 */
export const createEnv = arkenv;
