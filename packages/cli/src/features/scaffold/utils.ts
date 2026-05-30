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
 * Returns the framework usage instruction shown after scaffolding.
 */
export function getUsageInstructions(plan: ScaffoldingPlan): string {
	if (plan.metadata.framework === "vite") {
		return `2. Access via ${code("import.meta.env.YOUR_VAR")}`;
	}
	if (plan.metadata.framework === "bun-fullstack") {
		return `2. Access via ${code("process.env.YOUR_VAR")}`;
	}
	if (
		plan.metadata.framework === "nextjs" &&
		plan.metadata.layout === "strict"
	) {
		return `2. Import and use: ${code(`import { env } from "${plan.metadata.importPath}.client"`)} (client) or ${code(`import { env } from "${plan.metadata.importPath}.server"`)} (server)`;
	}
	return `2. Import and use: ${code(`import { env } from "${plan.metadata.importPath}"`)}`;
}

/**
 * Builds the final next steps note shown after a scaffolding run.
 */
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

	let displayLocation = plan.metadata.displayPath;
	if (plan.metadata.layout === "strict") {
		const lastDot = displayLocation.lastIndexOf(".");
		const base =
			lastDot !== -1 ? displayLocation.slice(0, lastDot) : displayLocation;
		displayLocation = `${base}.shared.ts, ${base}.client.ts, and ${base}.server.ts`;
	}

	return {
		message: dedent`
					1. Check ${code(displayLocation)} and refine your environment schema.
					${usage}
					3. (Recommended) Install the AI skill: ${code(`${dlx} skills add ${packageName}`)}
					   Then run ${code("/arkenv")} inside your AI assistant to finish.
				`,
		title: "Next steps",
	};
}
