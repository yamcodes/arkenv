import type { TransformOptions as BunTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";

/**
 * Config accepted by the Bun plugin factory (transform options and logging).
 */
export type BunPluginFactoryConfig = BunTransformOptions & ArkEnvLogOptions;
