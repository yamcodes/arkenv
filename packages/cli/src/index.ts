#!/usr/bin/env node
import { compose } from "@/cli/composition";

async function main() {
	const { cli, logger, initUseCase, helpUseCase } = compose(process.argv);

	if (cli.helpRequested) {
		await helpUseCase.execute();
		process.exit(0);
	}

	if (cli.command !== "init") {
		if (cli.command) {
			logger.error(`Unknown command: ${cli.command}`);
		} else {
			logger.error("Missing command.");
		}
		await helpUseCase.execute();
		process.exit(1);
	}

	try {
		await initUseCase.execute({
			isYes: cli.isYes,
			isQuiet: cli.isQuiet,
			isAgent: cli.isAgent,
		});
	} catch (error) {
		logger.fatal("An unexpected error occurred", error);
	}
}

main();

// Defense-in-depth for unforeseen async rejections
process.on("unhandledRejection", (err) => {
	const { logger } = compose(process.argv);
	logger.fatal("Unhandled rejection", err);
});
