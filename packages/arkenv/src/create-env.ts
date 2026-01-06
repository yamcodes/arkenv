import type { EnvSchemaWithType, InferType, SchemaShape } from "@repo/types";
import type { type as at, distill } from "arktype";
import { ArkTypeAdapter } from "./adapters/arktype";
import { StandardSchemaAdapter } from "./adapters/standard";
import { ArkEnvError } from "./errors";
import type { CoerceOptions } from "./utils";

export type EnvSchema<def> = at.validate<def, any>;
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
 * Pure Standard Schema entry point.
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
 * Ergonomic entry point. Alias for `createEnv`.
 * Supports ArkType raw objects, enabled if ArkType is present.
 */
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, any>>;
export function arkenv<T extends EnvSchemaWithType>(
	def: T,
	config?: ArkEnvConfig,
): InferType<T>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config?: ArkEnvConfig,
): distill.Out<at.infer<T, any>> | InferType<typeof def>;
export function arkenv<const T extends SchemaShape>(
	def: EnvSchema<T> | EnvSchemaWithType,
	config: ArkEnvConfig = {},
): distill.Out<at.infer<T, any>> | InferType<typeof def> {
	return defineEnv(def as any, config) as any;
}

/**
 * @deprecated Use `arkenv` or `defineEnv` instead.
 */
export const createEnv = arkenv;
