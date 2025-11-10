import { spawn } from "bun";
import { runSizeLimit } from "../size-limit/run.ts";
import type { SizeInBytes } from "../types.ts";
import { parseSizeToBytes } from "../utils/size.ts";

// Function to get baseline sizes from base branch
export const getBaselineSizes = async (
	baseBranch: string,
	filter: string,
	isPR: boolean,
): Promise<Map<string, SizeInBytes>> => {
	const baselineMap = new Map<string, SizeInBytes>();

	if (!isPR) {
		return baselineMap;
	}

	try {
		// Get current branch/commit
		const currentBranchProc = spawn(["git", "rev-parse", "HEAD"], {
			stdout: "pipe",
		});
		const currentCommit = (
			await new Response(currentBranchProc.stdout).text()
		).trim();

		// Check if base branch exists
		const checkBranchProc = spawn(
			["git", "ls-remote", "--heads", "origin", baseBranch],
			{ stdout: "pipe", stderr: "pipe" },
		);
		const checkBranchOutput = await new Response(checkBranchProc.stdout).text();

		if (!checkBranchOutput.trim()) {
			console.log(
				`⚠️ Base branch ${baseBranch} not found, skipping baseline comparison`,
			);
			return baselineMap;
		}

		console.log(`📊 Fetching baseline sizes from ${baseBranch}...`);

		// Fetch the base branch
		const fetchProc = spawn(["git", "fetch", "origin", baseBranch], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const fetchExitCode = await fetchProc.exited;
		if (fetchExitCode !== 0) {
			console.log(
				`⚠️ Failed to fetch ${baseBranch}, skipping baseline comparison`,
			);
			return baselineMap;
		}

		// Checkout base branch temporarily
		const checkoutProc = spawn(["git", "checkout", `origin/${baseBranch}`], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const checkoutExitCode = await checkoutProc.exited;
		if (checkoutExitCode !== 0) {
			console.log(
				`⚠️ Failed to checkout ${baseBranch}, skipping baseline comparison`,
			);
			return baselineMap;
		}

		// Install dependencies and build
		try {
			const installProc = spawn(["pnpm", "install"], {
				stdout: "pipe",
				stderr: "pipe",
			});
			const installExitCode = await installProc.exited;
			if (installExitCode !== 0) {
				console.log(
					`⚠️ Failed to install dependencies on ${baseBranch}, skipping baseline comparison`,
				);
				return baselineMap;
			}

			const buildProc = spawn(["pnpm", "run", "build", "--filter", filter], {
				stdout: "pipe",
				stderr: "pipe",
			});
			const buildExitCode = await buildProc.exited;
			if (buildExitCode !== 0) {
				console.log(
					`⚠️ Failed to build on ${baseBranch}, skipping baseline comparison`,
				);
				return baselineMap;
			}

			// Run size-limit on base branch
			const baselineResult = await runSizeLimit(filter);

			// Check if baseline run had errors before populating baseline map
			if (baselineResult.hasErrors) {
				console.log(
					"⚠️ Baseline size-limit run failed, skipping baseline comparison. Diff values will not be available.",
				);
				return baselineMap;
			}

			// Create a map of package+file -> size in bytes
			for (const result of baselineResult.results) {
				const key = `${result.package}:${result.file}`;
				const sizeBytes = parseSizeToBytes(result.size);
				baselineMap.set(key, sizeBytes);
			}

			// Always log baseline status for debugging
			if (baselineMap.size === 0) {
				console.log(
					"⚠️ No baseline sizes found. This might be the first run or baseline parsing failed.",
				);
				console.log(
					`📊 Baseline results array length: ${baselineResult.results.length}`,
				);
				if (baselineResult.results.length > 0) {
					console.log(
						`📊 First baseline result: ${JSON.stringify(baselineResult.results[0])}`,
					);
				} else {
					// If no results parsed, log a sample of the raw output to help debug parsing issues
					console.log(
						"⚠️ Baseline run completed but no results were parsed. This suggests a parsing issue.",
					);
					if (baselineResult.rawOutput) {
						const outputLines = baselineResult.rawOutput
							.split("\n")
							.filter((l) => l.trim());
						const sampleLines = outputLines.slice(0, 20).join("\n");
						console.log(
							`📊 Sample of baseline output (first 20 non-empty lines):\n${sampleLines}`,
						);
						if (outputLines.length > 20) {
							console.log(`... (${outputLines.length - 20} more lines)`);
						}
						if (outputLines.length === 0) {
							console.log("⚠️ Baseline output is completely empty!");
						}
					} else {
						console.log("⚠️ Baseline rawOutput is undefined!");
					}
				}
			} else {
				console.log(`✅ Found ${baselineMap.size} baseline size(s)`);
				for (const [key, size] of baselineMap.entries()) {
					console.log(`  - ${key}: ${size} bytes`);
				}
			}
		} finally {
			// Checkout back to current commit
			const restoreProc = spawn(["git", "checkout", currentCommit], {
				stdout: "pipe",
				stderr: "pipe",
			});
			const [restoreStdout, restoreStderr] = await Promise.all([
				new Response(restoreProc.stdout).text(),
				new Response(restoreProc.stderr).text(),
			]);
			const restoreExitCode = await restoreProc.exited;
			if (restoreExitCode !== 0) {
				console.error(
					`❌ Failed to restore git commit ${currentCommit}. Repository may be in an incorrect state.`,
				);
				console.error("Git stdout:", restoreStdout);
				console.error("Git stderr:", restoreStderr);
				process.exit(1);
			}
		}
	} catch (error) {
		console.log(
			`⚠️ Failed to get baseline sizes: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return baselineMap;
};
