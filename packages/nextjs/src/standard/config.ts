import type {
	ArkEnvConfigOptions,
	NextConfigContext,
	NextConfigFactory,
} from "@/config";
import { withArkEnvInternal } from "@/config/setup";

/**
 * Wrap a Next.js configuration object or function to generate `env.gen.ts` (Standard Mode).
 *
 * @param nextConfig The Next.js configuration object or `(phase, context)` factory
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object, or an async factory that resolves to it
 */
export function withArkEnv<T extends object>(
	nextConfig: NextConfigFactory<T>,
	options?: ArkEnvConfigOptions,
): (phase: string, context: NextConfigContext) => Promise<T>;
export function withArkEnv<T extends object>(
	nextConfig: T,
	options?: ArkEnvConfigOptions,
): T;
export function withArkEnv<T extends object>(
	nextConfig: T | NextConfigFactory<T>,
	options?: ArkEnvConfigOptions,
): T | ((phase: string, context: NextConfigContext) => Promise<T>) {
	return withArkEnvInternal(nextConfig, options, { _forceStandard: true });
}
