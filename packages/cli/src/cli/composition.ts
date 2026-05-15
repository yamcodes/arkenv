import { Logger } from "../adapters/logger.adapter";
import { NodeWorkspace } from "../adapters/node-workspace.adapter";
import { CLI } from "./cli";
import { HelpUseCase } from "./commands/help";
import { InitUseCase } from "./commands/init";

export function compose(argv: string[]) {
	const cli = new CLI(argv);
	const logger = cli.logger; // CLI currently creates the logger, which is fine for now
	const workspace = new NodeWorkspace(cli.isQuiet, logger.stdio);

	const initUseCase = new InitUseCase(logger, workspace);
	const helpUseCase = new HelpUseCase(logger);

	return {
		cli,
		logger,
		workspace,
		initUseCase,
		helpUseCase,
	};
}
