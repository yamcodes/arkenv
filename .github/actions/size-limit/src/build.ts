import { spawn } from "bun";
import type { Config } from "./config.ts";

// Install dependencies and build before running size checks
export const installAndBuild = async (
	config: Config,
	isReleasePR: boolean,
): Promise<void> => {
	if (!config.isPR) {
		return;
	}

	if (isReleasePR) {
		// Release PRs: install and build for the first time
		console.log("📦 Installing dependencies for release PR...");
		const installProc = spawn(["nub", "install"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const installExitCode = await installProc.exited;
		if (installExitCode !== 0) {
			console.error("❌ Failed to install dependencies");
			process.exit(1);
		}

		console.log("🔨 Building project for release PR...");
		const buildProc = spawn(
			["nub", "run", "build", "--filter", config.filter],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);
		const buildExitCode = await buildProc.exited;
		if (buildExitCode !== 0) {
			console.error("❌ Failed to build project");
			process.exit(1);
		}
	} else {
		// Regular PRs: reinstall and rebuild after baseline check
		// (getBaselineSizes checks out base branch and overwrites node_modules)
		console.log("📦 Reinstalling dependencies for current branch...");
		const reinstallProc = spawn(["nub", "install"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const reinstallExitCode = await reinstallProc.exited;
		if (reinstallExitCode !== 0) {
			console.log(
				"⚠️ Failed to reinstall dependencies, size check may be inaccurate",
			);
		}

		console.log("🔨 Rebuilding project for current branch...");
		const rebuildProc = spawn(
			["nub", "run", "build", "--filter", config.filter],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);
		const rebuildExitCode = await rebuildProc.exited;
		if (rebuildExitCode !== 0) {
			console.error(
				"❌ Failed to rebuild project, size check may be inaccurate",
			);
			process.exit(1);
		}
	}
};
