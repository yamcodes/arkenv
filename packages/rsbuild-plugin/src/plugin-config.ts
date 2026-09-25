import type { TransformOptions as RsbuildTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";

/**
 * Config accepted by the Rsbuild plugin factory (transform options, logging, and a build-time `env` override).
 */
export type RsbuildPluginFactoryConfig = RsbuildTransformOptions &
	ArkEnvLogOptions;
