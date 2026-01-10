import { spawn } from "bun";
import type { SizeLimitResult } from "../types.ts";
import { parseSizeLimitOutput, getPackageNames } from "../utils/parser.ts";

/**
 * Runs size-limit for the current branch and returns parsed results.
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
		// Identify all potential target packages for attribution
		const targetPackages = getPackageNames();

		// Run size-limit with --continue to ensure we get results for all packages even if one fails
		const proc = spawn(
			["pnpm", "run", "size", "--continue", "--filter", filter],
			{
				env,
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;
		const rawOutput = stdout + stderr;

		// Parse results using the captured target packages
		const results = parseSizeLimitOutput(rawOutput, targetPackages);

		return {
			results,
			hasErrors: exitCode !== 0,
			rawOutput,
		};
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		return { results: [], hasErrors: true, rawOutput: errorMsg };
	}
};
