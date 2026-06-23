import {
	type ArkEnvConfigOptions,
	withArkEnv as originalWithArkEnv,
} from "@/config";

/**
 * Wrap a Next.js configuration object to automatically generate the `runtimeEnv` block in `env.gen.ts` (Standard Mode).
 *
 * @param nextConfig The Next.js configuration object or function
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object unchanged
 */
export function withArkEnv<T>(nextConfig: T, options?: ArkEnvConfigOptions): T {
	return originalWithArkEnv(nextConfig, {
		...options,
		standard: true,
	});
}
