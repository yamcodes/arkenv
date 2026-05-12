#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { cancel, confirm, isCancel, outro } from "@clack/prompts";
import pc from "picocolors";
import { version } from "../package.json";
import { runPromptWizard } from "./prompts";
import {
	checkTsConfig,
	detectFramework,
	getDlxCommand,
	scaffold,
} from "./scaffold";
import { code, Logger, symbol } from "./visuals";

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const helpRequested = args.includes("--help") || args.includes("-h");

	let isYes = args.includes("--yes") || args.includes("-y");
	let isQuiet = args.includes("--quiet") || args.includes("-q");
	let isJson = args.includes("--json") || args.includes("-j");
	const isAgent = args.includes("--agent") || args.includes("-a");

	if (isAgent) {
		isYes = true;
		isQuiet = true;
		isJson = true;
	}

	const logger = new Logger({ isQuiet, isJson });

	const printHelp = () => {
		logger.log(`ArkEnv CLI v${version}`);
		logger.log("\nUsage:");
		logger.log("  arkenv init    Set up ArkEnv in your project");
		logger.log("\nOptions:");
		logger.log("  --yes, -y      Skip prompts and use recommended defaults");
		logger.log("  --agent, -a    Agent mode: --yes --quiet --json");
		logger.log("  --quiet, -q    Suppress spinners and ANSI colors");
		logger.log("  --json, -j     Output structured JSON to stdout");
		logger.log("  --help, -h     Show this help message");
	};

	if (helpRequested) {
		printHelp();
		process.exit(0);
	}

	if (command !== "init") {
		if (command) {
			logger.error(`Unknown command: ${command}`);
		} else {
			logger.error("Missing command.");
		}
		printHelp();
		process.exit(1);
	}

	// Redirect stdout to stderr for interactive prompts if JSON mode is active
	const originalStdoutWrite = process.stdout.write;
	if (isJson && !isYes) {
		process.stdout.write = process.stderr.write.bind(process.stderr);
	}

	let shouldUpdateTsConfig = false;
	const tsConfigResult = await checkTsConfig();

	if (tsConfigResult.status === "not_strict") {
		if (isYes) {
			shouldUpdateTsConfig = true;
		} else {
			logger.warn(
				`TypeScript strict mode is not enabled in your ${code(tsConfigResult.file!)}.`,
			);

			const confirmStrict = await confirm({
				message: `ArkEnv requires ${pc.dim("strict")} mode in your ${code(tsConfigResult.file!)}. Would you like to enable it now?`,
				initialValue: true,
				active: "Yes (Recommended)",
				inactive: "No",
			});

			if (isCancel(confirmStrict)) {
				if (isJson) {
					logger.json({
						status: "error",
						message: "Operation cancelled",
					});
				} else {
					cancel("Operation cancelled.");
				}
				process.exit(0);
			}

			if (confirmStrict) {
				shouldUpdateTsConfig = true;
			}
		}
	}

	const detectedFramework = await detectFramework();
	const options = await runPromptWizard(
		{ framework: detectedFramework },
		isYes,
	);

	// Restore stdout
	if (isJson && !isYes) {
		process.stdout.write = originalStdoutWrite;
	}

	if (!options) {
		if (isJson) {
			logger.json({
				status: "error",
				message: "Operation cancelled",
			});
		} else {
			cancel("Operation cancelled.");
		}
		process.exit(0);
	}

	const s = logger.spinner();
	s.start("Scaffolding ArkEnv configuration...");

	try {
		const {
			tsConfigResult: tsResult,
			installCmd,
			packageManager,
		} = await scaffold({
			...options,
			shouldUpdateTsConfig,
		});
		s.stop("Configuration scaffolded!");

		if (installCmd && process.env.SKIP_INSTALL !== "true") {
			logger.step(`Installing dependencies with ${packageManager}...`);
			await new Promise<void>((resolve, reject) => {
				const child = spawn(installCmd, {
					stdio: isJson
						? [process.stdin, process.stderr, process.stderr]
						: "inherit",
					shell: true,
				});
				child.on("close", (code) => {
					if (code === 0) resolve();
					else reject(new Error(`Installation failed with code ${code}`));
				});
				child.on("error", reject);
			});
		}

		if (tsResult.status === "updated") {
			logger.info(`Enforced strict: true in your ${code(tsResult.file!)}`);
		} else if (tsResult.status === "error") {
			logger.warn(
				`Could not automatically update ${code(tsResult.file || "tsconfig.json")}. Please ensure 'strict: true' is set manually.`,
			);
		}

		const relPath = path.relative(process.cwd(), path.resolve(options.path));
		const displayPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
		const importPath = displayPath.replace(/\.(ts|js|tsx|jsx)$/, "");

		const dlx = getDlxCommand(packageManager);
		let skillInstalled = false;
		if (options.installSkill && process.env.SKIP_INSTALL !== "true") {
			logger.step("Installing ArkEnv AI skill...");
			await new Promise<void>((resolve) => {
				const child = spawn(`${dlx} skills add yamcodes/arkenv`, {
					stdio: isJson
						? [process.stdin, process.stderr, process.stderr]
						: "inherit",
					shell: true,
				});
				child.on("close", (code) => {
					if (code === 0) {
						skillInstalled = true;
						resolve();
					} else {
						// Don't fail the whole process if skill install fails, but log it
						logger.warn("Failed to install ArkEnv AI skill.");
						resolve();
					}
				});
				child.on("error", (err) => {
					logger.warn(`Failed to install ArkEnv AI skill: ${err.message}`);
					resolve();
				});
			});
		}

		logger.step(
			`1. Check ${code(displayPath)} and adapt it to your needs. Review your schema to refine types (e.g., ${code("number")}, ${code("boolean")}, etc.).`,
		);
		logger.step(
			`2. Import and use your environment variables: ${code(`import { env } from "${importPath}"`)} → ${code("env.VAR_NAME")}`,
		);

		if (!skillInstalled) {
			logger.step(
				`3. Install the ArkEnv Agent Skill for AI assistance: ${code(`${dlx} skills add yamcodes/arkenv`)}`,
			);
		}

		if (isJson) {
			logger.json({
				status: "success",
				message: "ArkEnv initialized successfully",
				details: {
					path: displayPath,
					framework: options.framework,
					validator: options.validator,
					packageManager,
					tsConfigUpdated: tsResult.status === "updated",
					skillInstalled,
				},
			});
		} else {
			outro(`${symbol} ${pc.dim("Happy coding!")}`);
		}
	} catch (error) {
		s.stop("Scaffolding failed.");
		if (isJson) {
			logger.json({
				status: "error",
				message: String(error),
			});
		} else {
			logger.error(String(error));
		}
		process.exit(1);
	}
}

main();

// Defense-in-depth for unforeseen async rejections
process.on("unhandledRejection", (err) => {
	const logger = new Logger({
		isQuiet: process.argv.includes("--quiet") || process.argv.includes("-q"),
		isJson: process.argv.includes("--json") || process.argv.includes("-j"),
	});
	if (process.argv.includes("--json") || process.argv.includes("-j")) {
		logger.json({
			status: "error",
			message: String(err),
		});
	} else {
		logger.error(String(err));
	}
	process.exit(1);
});
