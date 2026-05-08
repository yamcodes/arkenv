#!/usr/bin/env node
import { intro, log, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { runPromptWizard } from "./prompts";
import { scaffold } from "./scaffold";

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

	const options = await runPromptWizard();

	if (!options) {
		outro(pc.yellow("Operation cancelled."));
		process.exit(0);
	}

	const s = spinner();
	s.start("Scaffolding ArkEnv and installing dependencies...");

	try {
		await scaffold(options);
		s.stop("Scaffolding complete!");

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
