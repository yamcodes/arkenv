import type { BuildLogHelpers } from "@repo/log";
import type { ArkEnvConfigOptions } from "./types";

let hasWarnedSimpleLayout = false;

export function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
	buildLog: BuildLogHelpers,
): "simple" | "strict" | undefined {
	if (layout === "flat") return "simple";
	if (layout !== "simple") return layout;

	const isDev = process.env.NODE_ENV === "development";
	if (!isDev || hasWarnedSimpleLayout) return "simple";

	hasWarnedSimpleLayout = true;
	buildLog.logBuildWarning(
		"The 'simple' layout option is deprecated and will be removed in the next major version. Use 'flat' instead.",
	);
	return "simple";
}
