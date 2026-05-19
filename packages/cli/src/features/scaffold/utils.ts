import dedent from "dedent";
import { code } from "@/shared/visuals";
import type { ScaffoldingPlan } from "./plan";

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

export function getUsageInstructions(plan: ScaffoldingPlan): string {
	if (plan.metadata.framework === "vite") {
		return `2. Access via ${code("import.meta.env.YOUR_VAR")}`;
	}
	if (plan.metadata.framework === "bun") {
		return `2. Access via ${code("process.env.YOUR_VAR")}`;
	}
	return `2. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}`;
}

export function getNextStepsNote(
	plan: ScaffoldingPlan,
	skillInstalled: boolean,
): { message: string; title: string } {
	if (skillInstalled) {
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
	const usage = getUsageInstructions(plan);

	return {
		message: dedent`
					1. Check ${code(plan.metadata.displayPath)} and refine your environment schema.
					${usage}
					3. (Recommended) Install the AI skill: ${code(`${dlx} skills add ${packageName}`)}
					   Then run ${code("/arkenv")} inside your AI assistant to finish.
				`,
		title: "Next steps",
	};
}
