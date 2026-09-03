import type { $ } from "@repo/scope";
import type { CompiledEnvSchema, InferType, SchemaShape } from "@repo/types";
import { type SafeArkEnvResult, safeExecute } from "@repo/utils";
import type { type as at, distill } from "arktype";
import type {
	ArkEnvConfig,
	ArkenvOutput,
	EnvSchema,
} from "./arkenv";
import { parse } from "./arktype";

export type { SafeArkEnvResult };

type TryArkenvConfig = Omit<ArkEnvConfig, "safe">;

/**
 * Parse environment variables and return a result object instead of throwing.
 *
 * @param def The schema definition
 * @param config The evaluation configuration
 * @returns `{ success: true, data }` or `{ success: false, issues }`
 */
export function tryArkenv<const T extends SchemaShape>(
	def: EnvSchema<T>,
	config?: TryArkenvConfig,
): SafeArkEnvResult<distill.Out<at.infer<T, $>>>;
export function tryArkenv<T extends CompiledEnvSchema>(
	def: T,
	config?: TryArkenvConfig,
): SafeArkEnvResult<InferType<T>>;
export function tryArkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(def: D, config?: TryArkenvConfig): SafeArkEnvResult<ArkenvOutput<T, D>>;
export function tryArkenv<
	const T extends SchemaShape,
	const D extends EnvSchema<T> | CompiledEnvSchema,
>(
	def: D,
	config: TryArkenvConfig = {},
): SafeArkEnvResult<ArkenvOutput<T, D>> {
	// biome-ignore lint/suspicious/noExplicitAny: parse handles both EnvSchema<T> and CompiledEnvSchema at runtime
	return safeExecute(() => parse(def as any, config));
}
