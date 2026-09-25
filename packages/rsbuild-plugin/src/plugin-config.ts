import type { TransformOptions as RsbuildTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";

/**
 * Config accepted by the Rsbuild plugin factory (transform options and logging).
 */
export type RsbuildPluginFactoryConfig = RsbuildTransformOptions &
	ArkEnvLogOptions;
