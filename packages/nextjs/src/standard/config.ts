import {
	type ArkEnvConfigOptions,
	type NextConfigContext,
	type NextConfigFactory,
	withArkEnv as originalWithArkEnv,
} from "@/config";

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
	return originalWithArkEnv(nextConfig as T, {
		...options,
		standard: true,
	}) as T | ((phase: string, context: NextConfigContext) => Promise<T>);
}
