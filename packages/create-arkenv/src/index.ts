#!/usr/bin/env node
import { intro, log, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { runPromptWizard } from "./prompts";
import { scaffold } from "./scaffold";

async function main() {
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

		outro(pc.green("Next steps:"));
		log.step(`1. Check ${pc.cyan("env.ts")} and adapt it to your needs.`);
		log.step(`2. Import ${pc.cyan("env")} in your entry point.`);
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
