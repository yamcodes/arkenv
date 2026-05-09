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
import { checkTsConfig, detectFramework, scaffold } from "./scaffold";
import { code } from "./visuals";

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	if (
		command === "--help" ||
		command === "-h" ||
		args.includes("--help") ||
		args.includes("-h") ||
		(command && command !== "init")
	) {
		console.log(pc.cyan("ArkEnv CLI"));
		console.log("\nUsage:");
		console.log("  arkenv init    Set up ArkEnv in your project");
		console.log("\nOptions:");
		console.log("  --help, -h     Show this help message");
		process.exit(0);
	}

	let shouldUpdateTsConfig = false;
	const tsConfigResult = await checkTsConfig();

	if (tsConfigResult.status === "not_strict") {
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

	const detectedFramework = await detectFramework();
	const options = await runPromptWizard({ framework: detectedFramework });

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
		outro(pc.green("Next steps:"));
		log.step(`1. Check ${code(displayPath)} and adapt it to your needs.`);
		log.step(
			`2. Import ${code("env")} from ${code(displayPath)} in your main entry file (e.g. index.ts or main.ts) to ensure environment variables are validated at startup.`,
		);
		log.info(pc.dim("Happy coding!"));
	} catch (error) {
		s.stop("Scaffolding failed.", 1);
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
