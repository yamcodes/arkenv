import type { BuildLogHelpers } from "@repo/log";
import type { ArkEnvConfigOptions } from "./types";

let hasWarnedSimpleLayout = false;

export function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
	buildLog: BuildLogHelpers,
): "simple" | "strict" | undefined {
	if (layout === "simple") {
		if (process.env.NODE_ENV === "development" && !hasWarnedSimpleLayout) {
			hasWarnedSimpleLayout = true;
			buildLog.logBuildWarning(
				"The 'simple' layout option is deprecated and will be removed in the next major version. Use 'flat' instead.",
			);
		}
		return "simple";
	}
	if (layout === "flat") {
		return "simple";
	}
	return layout;
}
