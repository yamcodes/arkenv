#!/usr/bin/env node
import { formatBuildError } from "@repo/utils";
import { shake } from "radashi";
import { Logger } from "./adapters/logger.adapter";
import { compose } from "./cli/composition";

// Detect if this file is being imported/required as a library rather than run directly as a CLI.
if (typeof require !== "undefined" && require.main !== module) {
	throw new Error(
		`🚨 ${formatBuildError(
			"You imported the 'arkenv' package as a library. " +
				"Starting with v1.0.0, the 'arkenv' package is exclusively the interactive CLI. " +
				"If you want to validate environment variables in your code, please install and import '@arkenv/core' instead.",
		)}`,
	);
}

const fallbackLogger = new Logger({ isQuiet: false, isJson: false });

let globalLogger: Logger | undefined;
let isShuttingDown = false;

/**
 * Composes the CLI, dispatches the requested command, and handles fatal failures.
 */
async function main() {
	if (process.env.INIT_CWD) {
		try {
			process.chdir(process.env.INIT_CWD);
		} catch {
			// Fallback to process.cwd() if directory change fails
		}
	}

	const { cli, logger, initUseCase, addUseCase, helpUseCase } = compose(
		process.argv,
	);
	globalLogger = logger;

	setupGracefulShutdown(logger);

	if (cli.validationError) {
		logger.error(cli.validationError);
		await helpUseCase.execute();
		await logger.flush();
		process.exit(1);
	}

	if (cli.helpRequested) {
		await helpUseCase.execute();
		await logger.flush();
		process.exit(0);
	}

	const commands = {
		init: () => initUseCase.execute(shake(cli.initInput)),
		add: () => addUseCase.execute(cli.addInput),
	} as const;

	const handler = cli.command
		? commands[cli.command as keyof typeof commands]
		: undefined;

	if (!handler) {
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
		const success = await handler();
		if (!success) {
			await logger.flush();
			process.exit(1);
		}
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

/**
 * Installs signal handlers that cancel prompts and flush logs before exiting.
 */
function setupGracefulShutdown(logger: any) {
	/**
	 * Flushes the current prompt and logger state before exiting with a signal code.
	 */
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
	const logger = globalLogger ?? fallbackLogger;
	try {
		logger.fatal("Unhandled rejection", err);
	} catch {
		// Already logged
	}
	await logger.flush();
	process.exit(1);
});

process.on("uncaughtException", async (err) => {
	const logger = globalLogger ?? fallbackLogger;
	try {
		logger.fatal("Uncaught exception", err);
	} catch {
		// Already logged
	}
	await logger.flush();
	process.exit(1);
});
