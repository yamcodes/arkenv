import type { TransformOptions as RsbuildTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";

/**
 * Combined config accepted by the Rsbuild plugin factory (transform + ArkEnv + logging).
 */
export type RsbuildPluginFactoryConfig = Omit<ArkEnvConfig, "safe"> &
	ArkEnvLogOptions &
	RsbuildTransformOptions;
