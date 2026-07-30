import {
	ClackPromptAdapter,
	NodeProjectScannerAdapter,
	NodeWorkspace,
} from "@/adapters";
import { CLI } from "./cli";
import { AddUseCase, HelpUseCase, InitUseCase } from "./commands";

/**
 * Bootstraps the application's dependency graph by composing
 * the core CLI instance with its adapters and use cases.
 *
 * @param argv Command line arguments.
 * @returns The composed instances.
 */
export function compose(argv: string[]) {
	const cli = new CLI(argv);
	const logger = cli.logger; // CLI currently creates the logger, which is fine for now
	const workspace = new NodeWorkspace(cli.isQuiet, logger.stdio, logger);
	const prompt = new ClackPromptAdapter();
	const scanner = new NodeProjectScannerAdapter(logger);

	const initUseCase = new InitUseCase(logger, workspace, prompt, scanner);
	const addUseCase = new AddUseCase(logger, workspace, prompt, scanner);
	const helpUseCase = new HelpUseCase(logger);

	return {
		cli,
		logger,
		workspace,
		prompt,
		initUseCase,
		addUseCase,
		helpUseCase,
	};
}
