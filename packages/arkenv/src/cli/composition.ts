import {
	ClackPromptAdapter,
	JitiSchemaLoaderAdapter,
	NodeProjectScannerAdapter,
	NodeWorkspace,
} from "@/adapters";
import { CLI } from "./cli";
import {
	CheckUseCase,
	HelpUseCase,
	InitUseCase,
	PresetUseCase,
} from "./commands";

/**
 * Bootstraps the application's dependency graph by composing
 * the core CLI instance with its adapters and use cases.
 *
 * @param argv Command line arguments.
 * @param options Optional overrides for testing or embedding.
 * @returns The composed instances.
 */
export function compose(
	argv: string[],
	options: { jitiAliases?: Record<string, string> } = {},
) {
	const cli = new CLI(argv);
	const logger = cli.logger;
	const workspace = new NodeWorkspace(cli.isQuiet, logger.stdio, logger);
	const prompt = new ClackPromptAdapter();
	const scanner = new NodeProjectScannerAdapter(logger);
	const jitiOptions = options.jitiAliases
		? { jitiAliases: options.jitiAliases }
		: {};
	const schemaLoader = new JitiSchemaLoaderAdapter(jitiOptions);

	const initUseCase = new InitUseCase(logger, workspace, prompt, scanner);
	const presetUseCase = new PresetUseCase(logger, workspace, prompt, scanner);
	const checkUseCase = new CheckUseCase(
		logger,
		workspace,
		scanner,
		schemaLoader,
		jitiOptions,
	);
	const helpUseCase = new HelpUseCase(logger);
	const checkUseCase = new CheckUseCase(
		logger,
		workspace,
		scanner,
		schemaLoader,
	);

	return {
		cli,
		logger,
		workspace,
		prompt,
		initUseCase,
		presetUseCase,
		checkUseCase,
		helpUseCase,
		checkUseCase,
		schemaLoader,
	};
}
