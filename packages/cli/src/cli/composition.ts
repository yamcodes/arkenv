import { NodeWorkspace } from "@/adapters/node-workspace.adapter";
import { ClackPromptAdapter } from "@/adapters/prompt.adapter";
import { CLI } from "@/cli/cli";
import { HelpUseCase } from "@/cli/commands/help";
import { InitUseCase } from "@/cli/commands/init";

export function compose(argv: string[]) {
	const cli = new CLI(argv);
	const logger = cli.logger; // CLI currently creates the logger, which is fine for now
	const workspace = new NodeWorkspace(cli.isQuiet, logger.stdio);
	const prompt = new ClackPromptAdapter();

	const initUseCase = new InitUseCase(logger, workspace, prompt);
	const helpUseCase = new HelpUseCase(logger);

	return {
		cli,
		logger,
		workspace,
		prompt,
		initUseCase,
		helpUseCase,
	};
}
