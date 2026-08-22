import type { TransformOptions as BunTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";

/**
 * Combined config accepted by the Bun plugin factory (transform + ArkEnv + logging).
 */
export type BunPluginFactoryConfig = Omit<ArkEnvConfig, "safe"> &
	ArkEnvLogOptions &
	BunTransformOptions;
