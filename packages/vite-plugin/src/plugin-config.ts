import type { TransformOptions as ViteTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";

/**
 * Combined config accepted by the Vite plugin factory (transform + ArkEnv + logging).
 */
export type VitePluginFactoryConfig = Omit<ArkEnvConfig, "safe"> &
	ArkEnvLogOptions &
	ViteTransformOptions;
