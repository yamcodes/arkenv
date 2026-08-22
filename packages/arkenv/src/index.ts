import { formatBuildError } from "@repo/utils";

throw new Error(
	`🚨 ${formatBuildError(
		"You imported the 'arkenv' package as a library. " +
			"Starting with v1.0.0, the 'arkenv' package is exclusively the interactive CLI. " +
			"If you want to validate environment variables in your code, please install and import '@arkenv/core' (or '@arkenv/standard') instead, or run `npx arkenv@latest init` to guide you through setup.",
	)}`,
);

/**
 * @deprecated The 'arkenv' package is exclusively an interactive CLI in v1.0.0+.
 * If you want to validate environment variables in your code, please install and import '@arkenv/core' (or '@arkenv/standard') instead, or run `npx arkenv@latest init`.
 */
declare const arkenv: never;

/**
 * @deprecated The 'arkenv' package is exclusively an interactive CLI in v1.0.0+.
 * If you want to validate environment variables in your code, please install and import '@arkenv/core' (or '@arkenv/standard') instead, or run `npx arkenv@latest init`.
 */
export type Arkenv = never;

export default arkenv;
export { arkenv };
