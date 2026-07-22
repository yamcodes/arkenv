import type { ArkEnvLogOptions } from "@repo/log";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import type { BunTransformOptions } from "./transform-options";

/** Combined config accepted by the Bun plugin factory (transform + ArkEnv + logging). */
export type BunPluginFactoryConfig = Omit<ArkEnvConfig, "safe"> &
	ArkEnvLogOptions &
	BunTransformOptions;
