import type { TransformOptions as BunTransformOptions } from "@arkenv/build";
import type { ArkEnvLogOptions } from "@repo/log";

/**
 * Config accepted by the Bun plugin factory (transform options, logging, and a build-time `env` override).
 */
export type BunPluginFactoryConfig = BunTransformOptions & ArkEnvLogOptions;
