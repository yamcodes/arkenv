import { spawn } from "bun";
import type { SizeLimitResult } from "../types.ts";
import { parseSizeLimitOutput } from "../utils/parser.ts";

// Function to run size-limit and parse results
export const runSizeLimit = async (
	filter: string,
): Promise<{
	results: SizeLimitResult[];
	hasErrors: boolean;
	rawOutput?: string;
}> => {
	let sizeOutput = "";
	let hasErrors = false;

	try {
		const proc = spawn(["pnpm", "run", "size", "--filter", filter], {
			stdout: "pipe",
			stderr: "pipe",
			env: process.env,
		});

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;
		sizeOutput = stdout + stderr;
		hasErrors = exitCode !== 0;
	} catch (error) {
		sizeOutput = error instanceof Error ? error.message : String(error);
		hasErrors = true;
	}

	const results = parseSizeLimitOutput(sizeOutput, filter);
	return { results, hasErrors, rawOutput: sizeOutput };
};
