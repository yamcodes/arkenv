#!/usr/bin/env node
import { CLI } from "./cli";
import { HelpCommand } from "./commands/help";
import { InitCommand } from "./commands/init";

async function main() {
	const cli = new CLI(process.argv);

	if (cli.helpRequested) {
		await new HelpCommand(cli).run();
		process.exit(0);
	}

	if (cli.command !== "init") {
		if (cli.command) {
			cli.logger.error(`Unknown command: ${cli.command}`);
		} else {
			cli.logger.error("Missing command.");
		}
		await new HelpCommand(cli).run();
		process.exit(1);
	}

	try {
		const command = new InitCommand(cli);
		await command.run();
	} catch (error) {
		cli.logger.fatal("An unexpected error occurred", error);
	}
}

main();

// Defense-in-depth for unforeseen async rejections
process.on("unhandledRejection", (err) => {
	const cli = new CLI(process.argv);
	cli.logger.fatal("Unhandled rejection", err);
});
