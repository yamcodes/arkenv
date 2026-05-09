#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { cancel, confirm, isCancel, log, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { version } from "../package.json";
import { runPromptWizard } from "./prompts";
import { checkTsConfig, detectFramework, scaffold } from "./scaffold";
import { code, symbol } from "./visuals";

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const helpRequested = args.includes("--help") || args.includes("-h");

	const isYes = args.includes("--yes") || args.includes("-y");

	const printHelp = () => {
		console.log(`${symbol} ${pc.cyan(`ArkEnv CLI v${version}`)}`);
		console.log("\nUsage:");
		console.log("  arkenv init    Set up ArkEnv in your project");
		console.log("\nOptions:");
		console.log("  --yes, -y      Skip prompts and use recommended defaults");
		console.log("  --help, -h     Show this help message");
	};

	if (helpRequested) {
		printHelp();
		process.exit(0);
	}

	if (command !== "init") {
		if (command) {
			console.error(pc.red(`Unknown command: ${command}`));
		} else {
			console.error(pc.red("Missing command."));
		}
		printHelp();
		process.exit(1);
	}

	let shouldUpdateTsConfig = false;
	const tsConfigResult = await checkTsConfig();

	if (tsConfigResult.status === "not_strict") {
		if (isYes) {
			shouldUpdateTsConfig = true;
		} else {
			log.warn(
				pc.yellow(
					`⚠ TypeScript strict mode is not enabled in your ${code(tsConfigResult.file!)}.`,
				),
			);

			const confirmStrict = await confirm({
				message: `ArkEnv requires ${pc.dim("strict")} mode in your ${code(tsConfigResult.file!)}. Would you like to enable it now?`,
				initialValue: true,
				active: "Yes (Recommended)",
				inactive: "No",
			});

			if (isCancel(confirmStrict)) {
				cancel("Operation cancelled.");
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

	if (!options) {
		cancel("Operation cancelled.");
		process.exit(0);
	}

	const s = spinner();
	s.start("Scaffolding ArkEnv configuration...");

	try {
		const { tsConfigResult, installCmd, packageManager } = await scaffold({
			...options,
			shouldUpdateTsConfig,
		});
		s.stop("Configuration scaffolded!");

		if (installCmd) {
			log.step(`Installing dependencies with ${packageManager}...`);
			await new Promise<void>((resolve, reject) => {
				const child = spawn(installCmd, { stdio: "inherit", shell: true });
				child.on("close", (code) => {
					if (code === 0) resolve();
					else reject(new Error(`Installation failed with code ${code}`));
				});
				child.on("error", reject);
			});
		}

		if (tsConfigResult.status === "updated") {
			log.info(
				pc.blue(
					`ℹ Enforced strict: true in your ${code(tsConfigResult.file!)}`,
				),
			);
		} else if (tsConfigResult.status === "error") {
			log.warn(
				pc.yellow(
					`⚠ Could not automatically update ${code(tsConfigResult.file || "tsconfig.json")}. Please ensure 'strict: true' is set manually.`,
				),
			);
		}

		const relPath = path.relative(process.cwd(), path.resolve(options.path));
		const displayPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
		const importPath = displayPath.replace(/\.(ts|js|tsx|jsx)$/, "");

		log.step(
			`1. Check ${code(displayPath)} and adapt it to your needs. Review your schema to refine types (e.g., ${code("number")}, ${code("boolean")}, etc.).`,
		);
		log.step(
			`2. Import and use your environment variables: ${code(`import { env } from "${importPath}"`)} → ${code("env.VAR_NAME")}`,
		);

		outro(`${symbol} ${pc.dim("Happy coding!")}`);
	} catch (error) {
		s.stop("Scaffolding failed.");
		log.error(String(error));
		process.exit(1);
	}
}

main();
// Defense-in-depth for unforeseen async rejections
process.on("unhandledRejection", (err) => {
	log.error(String(err));
	process.exit(1);
});
