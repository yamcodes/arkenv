import type { ArkEnvLogOptions } from "@repo/log";
import type { ParseStandardConfig as ArkEnvConfig } from "@repo/utils";
import type { ViteTransformOptions } from "./transform-options";

/** Combined config accepted by the Vite plugin factory (transform + ArkEnv + logging). */
export type VitePluginFactoryConfig = Omit<ArkEnvConfig, "safe"> &
	ArkEnvLogOptions &
	ViteTransformOptions;
