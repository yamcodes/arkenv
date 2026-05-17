#!/usr/bin/env node
import { compose } from "./cli/composition";

let globalLogger: any;
let isShuttingDown = false;

async function main() {
	const { cli, logger, initUseCase, helpUseCase } = compose(process.argv);
	globalLogger = logger;

	setupGracefulShutdown(logger);

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
		try {
			logger.fatal("An unexpected error occurred", error);
		} catch {
			// Ignore throw from fatal as we are already handling the error
		}
		await logger.flush();
		process.exit(1);
	}
}

function setupGracefulShutdown(logger: any) {
	const shutdown = async (code: number) => {
		if (isShuttingDown) {
			process.exit(code);
		}
		isShuttingDown = true;

		// Force exit after 2 seconds if graceful shutdown hangs
		const timeout = setTimeout(() => {
			process.exit(code);
		}, 2000);
		timeout.unref();

		if (logger.interactiveStdout) {
			logger.interactiveStdout(false);
		}

		try {
			logger.cancel("Operation cancelled.");
			await logger.flush();
		} catch (err) {
			// Best-effort logging on shutdown failure
			if (logger.error) {
				logger.error("Logger failed during shutdown", err);
			}
		} finally {
			process.exit(code);
		}
	};

	process.on("SIGINT", () => shutdown(130));
	process.on("SIGTERM", () => shutdown(143));
}

main();

// Defense-in-depth for unforeseen async rejections
process.on("unhandledRejection", async (err) => {
	if (globalLogger) {
		try {
			globalLogger.fatal("Unhandled rejection", err);
		} catch {
			// Already logged
		}
		await globalLogger.flush();
	} else {
		console.error("Unhandled rejection", err);
	}
	process.exit(1);
});

process.on("uncaughtException", async (err) => {
	if (globalLogger) {
		try {
			globalLogger.fatal("Uncaught exception", err);
		} catch {
			// Already logged
		}
		await globalLogger.flush();
	} else {
		console.error("Uncaught exception", err);
	}
	process.exit(1);
});
