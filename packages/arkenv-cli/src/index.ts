#!/usr/bin/env node
import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	outro,
	spinner,
} from "@clack/prompts";
import pc from "picocolors";
import { runPromptWizard } from "./prompts";
import { checkTsConfig, scaffold } from "./scaffold";

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (command && command !== "init") {
		console.log(pc.cyan("ArkEnv CLI"));
		console.log("\nUsage:");
		console.log("  arkenv init    Set up ArkEnv in your project");
		console.log("\nOptions:");
		console.log("  --help, -h     Show this help message");
		process.exit(0);
	}

	intro(pc.cyan("ArkEnv Scaffolding"));

	let shouldUpdateTsConfig = false;
	const tsConfigResult = await checkTsConfig();

	if (tsConfigResult.status === "not_strict") {
		log.warn(
			pc.yellow(
				`⚠ TypeScript strict mode is not enabled in your ${pc.cyan(tsConfigResult.file)}.`,
			),
		);

		const confirmStrict = await confirm({
			message: `ArkEnv requires ${pc.dim("strict")} mode in your ${pc.cyan(tsConfigResult.file)}. Would you like to enable it now?`,
			initialValue: true,
		});

		if (isCancel(confirmStrict) || !confirmStrict) {
			cancel("Strict mode rejected. ArkEnv setup cancelled.");
			process.exit(0);
		}

		shouldUpdateTsConfig = true;
	}

	const options = await runPromptWizard();

	if (!options) {
		outro(pc.yellow("Operation cancelled."));
		process.exit(0);
	}

	const s = spinner();
	s.start("Scaffolding ArkEnv and installing dependencies...");

	try {
		const { tsConfigResult } = await scaffold({
			...options,
			shouldUpdateTsConfig,
		});
		s.stop("Scaffolding complete!");

		if (tsConfigResult.status === "updated") {
			log.info(
				pc.blue(
					`ℹ Enforced strict: true in your ${pc.cyan(tsConfigResult.file)}`,
				),
			);
		} else if (tsConfigResult.status === "error") {
			log.warn(
				pc.yellow(
					`⚠ Could not automatically update ${pc.cyan(tsConfigResult.file || "tsconfig.json")}. Please ensure 'strict: true' is set manually.`,
				),
			);
		}

		const relPath = options.path.startsWith("./")
			? options.path
			: `./${options.path}`;
		outro(pc.green("Next steps:"));
		log.step(`1. Check ${pc.cyan(relPath)} and adapt it to your needs.`);
		log.step(
			`2. Import ${pc.cyan("env")} from ${pc.cyan(relPath)} in your main entry file (e.g. index.ts or main.ts) to ensure environment variables are validated at startup.`,
		);
		log.info(pc.dim("Happy coding!"));
	} catch (error) {
		s.stop("Scaffolding failed.", 1);
		log.error(String(error));
		process.exit(1);
	}
}

main().catch((err) => {
	log.error(String(err));
	process.exit(1);
});
