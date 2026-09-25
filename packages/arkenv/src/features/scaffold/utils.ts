import { code } from "@/shared/visuals";
import { integrationEntry, usesStandardEngine } from "./engine";
import type { ScaffoldingPlan } from "./plan";

/** Manual install printed in next steps. Init does not run this command. */
const SKILL_INSTALL_COMMAND = "npx skills add yamcodes/arkenv";

/**
 * Build the package manager command used to install dependencies or run a bare install.
 *
 * @param pm The package manager name (e.g. `"pnpm"`, `"yarn"`, `"bun"`, or npm fallback)
 * @param deps The dependency names to add; pass an empty array to run a bare install
 * @returns A tuple of `[executable, args]` ready to pass to a child-process spawn call
 */
export function getInstallCommand(
	pm: string,
	deps: string[],
): [string, string[]] {
	const isAdding = deps.length > 0;
	switch (pm) {
		case "pnpm":
			return ["pnpm", [isAdding ? "add" : "install", ...deps]];
		case "yarn":
			return ["yarn", [isAdding ? "add" : "install", ...deps]];
		case "bun":
			return ["bun", [isAdding ? "add" : "install", ...deps]];
		default:
			return ["npm", ["install", ...deps]];
	}
}

/**
 * Build the final next-steps note shown after a scaffolding run.
 *
 * @param plan The scaffolding plan produced by the planner
 * @param nextjsConfigBootstrapped Whether the Next.js config was already wrapped with `withArkEnv`
 * @returns An object with a `title` and a multi-line `message` string
 */
export function getNextStepsNote(
	plan: ScaffoldingPlan,
	nextjsConfigBootstrapped?: boolean,
): { message: string; title: string } {
	let message = "";
	let step = 1;

	const displayLocation = plan.metadata.displayPath;

	message += `${step++}. Check ${code(displayLocation)} and refine your environment schema.\n`;

	const isNextjsWithCodegen =
		plan.metadata.framework === "nextjs" && !plan.metadata.disableCodegen;
	const needsManualConfig = isNextjsWithCodegen && !nextjsConfigBootstrapped;

	if (plan.metadata.framework === "nextjs") {
		if (plan.metadata.disableCodegen) {
			message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
		} else {
			if (needsManualConfig) {
				const configEntry = integrationEntry(
					"@arkenv/nextjs",
					usesStandardEngine(plan.metadata.validator),
					"config",
				);
				message += `${step++}. Wrap your Next.js config with ${code("withArkEnv")} inside ${code("next.config.ts")}:\n`;
				message += `   ${code(`import { withArkEnv } from "${configEntry}";`)}\n`;
				message += `   ${code("export default withArkEnv(nextConfig);")}\n`;
			}
			message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
		}
	} else {
		message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
	}

	if (!plan.metadata.skillDetected) {
		message += `${step++}. (Recommended) Install the AI skill: ${code(SKILL_INSTALL_COMMAND)}\n`;
	}

	return {
		message,
		title: "Next steps",
	};
}
