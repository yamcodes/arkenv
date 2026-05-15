#!/usr/bin/env node
import { compose } from "./cli/composition";

let globalLogger: any;

async function main() {
	const { cli, logger, initUseCase, helpUseCase } = compose(process.argv);
	globalLogger = logger;

	if (cli.helpRequested) {
		await helpUseCase.execute();
		await logger.flush();
		process.exit(0);
	}

	if (cli.command !== "init") {
		if (cli.command) {
			logger.error(`Unknown command: ${cli.command}`);
		} else {
			logger.error("Missing command.");
		}
		await helpUseCase.execute();
		await logger.flush();
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
		await logger.flush();
		process.exit(1);
	}
}

main();

// Defense-in-depth for unforeseen async rejections
process.on("unhandledRejection", async (err) => {
	if (globalLogger) {
		globalLogger.fatal("Unhandled rejection", err);
		await globalLogger.flush();
	} else {
		console.error("Unhandled rejection", err);
	}
	process.exit(1);
});

process.on("uncaughtException", async (err) => {
	if (globalLogger) {
		globalLogger.fatal("Uncaught exception", err);
		await globalLogger.flush();
	} else {
		console.error("Uncaught exception", err);
	}
	process.exit(1);
});
