import dedent from "dedent";
import { code } from "@/shared/visuals";
import type { ScaffoldingPlan } from "./plan";

/**
 * Builds the package manager command used to install dependencies or run a bare install.
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
 * Builds the final next steps note shown after a scaffolding run.
 */
export function getNextStepsNote(
	plan: ScaffoldingPlan,
	skillInstalled: boolean,
): { message: string; title: string } {
	if (skillInstalled || plan.metadata.skillDetected) {
		return {
			message: dedent`
					Inside your AI assistant (e.g. Claude Code), use:
					${code("/arkenv")} - automatically refine your schema and configure integrations.
				`,
			title: "Next steps",
		};
	}

	const dlx = plan.skill?.dlxCommand.join(" ") || "npx";
	const packageName = plan.skill?.packageName || "yamcodes/arkenv";

	let message = "";
	let step = 1;

	message += `${step++}. Check ${code(plan.metadata.displayPath)} and refine your environment schema.\n`;

	if (plan.metadata.framework === "vite") {
		message += `${step++}. Access via ${code("import.meta.env.YOUR_VAR")}\n`;
	} else if (plan.metadata.framework === "bun-fullstack") {
		message += `${step++}. Access via ${code("process.env.YOUR_VAR")}\n`;
	} else if (plan.metadata.framework === "nextjs") {
		message += `${step++}. Wrap your Next.js config with ${code("withArkEnv")} inside ${code("next.config.ts")}:\n`;
		message += `   ${code('import { withArkEnv } from "@arkenv/nextjs/config";')}\n`;
		message += `   ${code("export default withArkEnv(nextConfig);")}\n`;
		message += `${step++}. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}\n`;
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
