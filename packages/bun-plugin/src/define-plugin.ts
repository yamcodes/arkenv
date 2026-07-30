import {
	type ArkEnvLogOptions,
	resolveBuildLog,
	splitPluginConfig,
} from "@repo/log";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import type { BunPlugin } from "bun";
import { processEnvSchema, registerLoader } from "./utils";

/**
 * Build the SPA-mode plugin: validate at creation and rewrite `process.env` reads.
 *
 * @param coreArkenv The ArkEnv runtime function used for schema validation
 * @param pluginName The Bun plugin name
 * @param schema The environment variable schema definition
 * @param config Optional ArkEnv configuration and build-time logging options
 * @param factoryLogOptions Default logging options from the factory
 * @returns A Bun plugin that rewrites `process.env.BUN_PUBLIC_*` accessors
 */
export function createDefinePlugin(
	coreArkenv: (
		def: any,
		config?: Omit<ArkEnvConfig, "safe">,
	) => Record<string, unknown>,
	pluginName: string,
	schema: Record<string, unknown>,
	config?: Omit<ArkEnvConfig, "safe"> & ArkEnvLogOptions,
	factoryLogOptions?: ArkEnvLogOptions,
): BunPlugin {
	const { pluginConfig, logOptions } = splitPluginConfig(config);
	const buildLog = resolveBuildLog({
		...factoryLogOptions,
		...logOptions,
	});

	let envMap: Map<string, string>;
	try {
		envMap = processEnvSchema(schema as any, pluginConfig, coreArkenv);
	} catch (error: unknown) {
		buildLog.logBuildErrorWithCause("Environment validation failed", error);
		throw error;
	}

	return {
		name: pluginName,
		setup(build) {
			registerLoader(build, envMap);
		},
	} satisfies BunPlugin;
}
