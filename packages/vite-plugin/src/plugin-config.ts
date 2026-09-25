import type { TransformOptions as ViteTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";

/**
 * Config accepted by the Vite plugin factory (transform options, logging, and a build-time `env` override).
 */
export type VitePluginFactoryConfig = ViteTransformOptions & ArkEnvLogOptions;
