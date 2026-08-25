#!/usr/bin/env node
import { startMcpServer } from "./mcp/server";

/**
 * Start the ArkEnv MCP server over stdio.
 */
function main(): void {
	void startMcpServer().catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
}

main();
