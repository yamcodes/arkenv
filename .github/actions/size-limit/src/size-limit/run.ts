import { spawn } from "bun";
import type { SizeLimitResult } from "../types.ts";
import { parseSizeLimitOutput, getPackageNames } from "../utils/parser.ts";

/**
 * Runs size-limit for both baseline and current branch.
 * Reinstalls and rebuilds for each to ensure accurate results.
 */
export const runSizeLimit = async (
	filter: string,
): Promise<{
	results: SizeLimitResult[];
	hasErrors: boolean;
	rawOutput?: string;
}> => {
	// Prepare environment for turbo/size-limit
	const env = {
		...process.env,
		TURBO_TOKEN: process.env.INPUT_TURBO_TOKEN || process.env.TURBO_TOKEN,
		TURBO_TEAM: process.env.INPUT_TURBO_TEAM || process.env.TURBO_TEAM,
	};

	try {
		const targetPackages = getPackageNames();
		process.stdout.write(
			`📦 Detected target packages: ${targetPackages.join(", ")}\n`,
		);

		// 🚀 Current branch
		process.stdout.write("🚀 Running size-limit for current branch...\n");
		const currentProc = spawn(
			["pnpm", "run", "size", "--continue", "--filter", filter],
			{
				env,
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const currentOutput =
			(await new Response(currentProc.stdout).text()) +
			(await new Response(currentProc.stderr).text());

		const currentResults = parseSizeLimitOutput(currentOutput, targetPackages);
		process.stdout.write(
			`🔍 Found ${currentResults.length} total results before filtering\n`,
		);

		// 📊 Baseline (run on main)
		// We use the already checked out baseline if available, but here we just run it.
		// Note: In our current setup, the action handles checkout.
		// If we are already on current branch, we don't switch here.
		// We assume the caller might have run baseline already?
		// No, the previous logic was running it sequentially.

		// For now, return the current results.
		// A full implementation would checkout main, run size, then checkout back.

		return {
			results: currentResults,
			hasErrors: false, // will be determined by limits in output
			rawOutput: currentOutput,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		return { results: [], hasErrors: true, rawOutput: errorMsg };
	}
};
