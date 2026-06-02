import dedent from "dedent";
import { code } from "@/shared/visuals";
import type { ScaffoldingPlan } from "./plan";

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
 * When the AI skill is already installed, returns a short prompt to use the
 * `/arkenv` slash command. Otherwise constructs a numbered checklist tailored
 * to the project's framework, layout, and codegen settings.
 *
 * @param plan The scaffolding plan produced by the planner
 * @param skillInstalled Whether the ArkEnv AI skill was installed during this run
 * @returns An object with a `title` and a multi-line `message` string
 */
export function getNextStepsNote(
	plan: ScaffoldingPlan,
	skillInstalled: boolean,
	nextjsConfigBootstrapped?: boolean,
): { message: string; title: string } {
	if (skillInstalled || plan.metadata.skillDetected) {
		const isNextjsWithCodegen =
			plan.metadata.framework === "nextjs" && !plan.metadata.disableCodegen;
		const needsManualConfig = isNextjsWithCodegen && !nextjsConfigBootstrapped;

		let message = dedent`
				Inside your AI assistant (e.g. Claude Code), use:
				${code("/arkenv")} - automatically refine your schema and configure integrations.
			`;

		if (needsManualConfig) {
			message += "\n\n";
			message += `Also, wrap your Next.js config with ${code("withArkEnv")}:\n`;
			message += `   ${code('import { withArkEnv } from "@arkenv/nextjs/config";')}\n`;
			if (plan.metadata.layout === "strict") {
				message += `   ${code("export default withArkEnv(nextConfig);")}\n`;
				message += `Import and use: ${code(`import { env } from "${plan.metadata.importPath}/client"`)} (client) or ${code(`import { env } from "${plan.metadata.importPath}/server"`)} (server)\n`;
			} else {
				message += `   ${code("export default withArkEnv(nextConfig);")}\n`;
				message += `Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
			}
		}

		return {
			message,
			title: "Next steps",
		};
	}

	const dlx = plan.skill?.dlxCommand.join(" ") || "npx";
	const packageName = plan.skill?.packageName || "yamcodes/arkenv";

	let message = "";
	let step = 1;

	let displayLocation = plan.metadata.displayPath;
	if (plan.metadata.layout === "strict") {
		const lastDot = displayLocation.lastIndexOf(".");
		const base =
			lastDot !== -1 ? displayLocation.slice(0, lastDot) : displayLocation;
		displayLocation = `${base}/client.ts, ${base}/server.ts, and ${base}/internal/shared.ts`;
	}

	message += `${step++}. Check ${code(displayLocation)} and refine your environment schema.\n`;

	const isNextjsWithCodegen =
		plan.metadata.framework === "nextjs" && !plan.metadata.disableCodegen;
	const needsManualConfig = isNextjsWithCodegen && !nextjsConfigBootstrapped;

	if (plan.metadata.framework === "vite") {
		message += `${step++}. Access via ${code("import.meta.env.YOUR_VAR")}\n`;
	} else if (plan.metadata.framework === "bun-fullstack") {
		message += `${step++}. Access via ${code("process.env.YOUR_VAR")}\n`;
	} else if (plan.metadata.framework === "nextjs") {
		if (plan.metadata.layout === "strict") {
			if (plan.metadata.disableCodegen) {
				message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}/client"`)} (client) or ${code(`import { env } from "${plan.metadata.importPath}/server"`)} (server)\n`;
			} else {
				if (needsManualConfig) {
					message += `${step++}. Wrap your Next.js config with ${code("withArkEnv")} inside ${code("next.config.ts")}:\n`;
					message += `   ${code('import { withArkEnv } from "@arkenv/nextjs/config";')}\n`;
					message += `   ${code("export default withArkEnv(nextConfig);")}\n`;
				}
				message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}/client"`)} (client) or ${code(`import { env } from "${plan.metadata.importPath}/server"`)} (server)\n`;
			}
		} else if (plan.metadata.disableCodegen) {
			message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
		} else {
			if (needsManualConfig) {
				message += `${step++}. Wrap your Next.js config with ${code("withArkEnv")} inside ${code("next.config.ts")}:\n`;
				message += `   ${code('import { withArkEnv } from "@arkenv/nextjs/config";')}\n`;
				message += `   ${code("export default withArkEnv(nextConfig);")}\n`;
			}
			message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
		}
	} else {
		message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
	}

	message += `${step++}. (Recommended) Install the AI skill: ${code(`${dlx} skills add ${packageName}`)}\n`;
	message += `   Then run ${code("/arkenv")} inside your AI assistant to finish.`;

	return {
		message,
		title: "Next steps",
	};
}
