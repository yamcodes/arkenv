import type { TransformOptions as ViteTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";

/**
 * Config accepted by the Vite plugin factory (transform options and logging).
 */
export type VitePluginFactoryConfig = ViteTransformOptions & ArkEnvLogOptions;
