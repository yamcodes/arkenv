import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { version } from "../../package.json";
import {
	AUDIT_TOOL_NAME,
	INIT_TOOL_NAME,
	runAuditTool,
	runInitTool,
} from "./tools";

const AUDIT_INPUT_SCHEMA = {
	type: "object",
	properties: {
		cwd: {
			type: "string",
			description:
				"Project root to scan. Defaults to the current working directory.",
		},
	},
} as const;

const INIT_INPUT_SCHEMA = {
	type: "object",
	properties: {
		cwd: {
			type: "string",
			description: "Project root. Defaults to the current working directory.",
		},
		extraArgs: {
			type: "array",
			items: { type: "string" },
			description:
				"Extra CLI flags such as --force after a documented refusal.",
		},
	},
} as const;

/**
 * Create the ArkEnv MCP server with `audit` and `init` tools.
 *
 * @returns Configured MCP server (not yet connected)
 */
export function createMcpServer(): Server {
	const server = new Server(
		{ name: "arkenv", version },
		{ capabilities: { tools: {} } },
	);

	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [
			{
				name: AUDIT_TOOL_NAME,
				description:
					"Scan the project for unvalidated process.env / import.meta.env access, server secrets in client modules, public-prefix violations, and leftover v0 ambient .d.ts augmentations.",
				inputSchema: AUDIT_INPUT_SCHEMA,
			},
			{
				name: INIT_TOOL_NAME,
				description:
					"Scaffold ArkEnv by running `arkenv init --agent`. Never pass --force unless a previous refusal listed it in retryWith.",
				inputSchema: INIT_INPUT_SCHEMA,
			},
		],
	}));

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const args = (request.params.arguments ?? {}) as {
			cwd?: string;
			extraArgs?: string[];
		};
		if (request.params.name === AUDIT_TOOL_NAME) {
			return runAuditTool(args.cwd ?? process.cwd());
		}
		if (request.params.name === INIT_TOOL_NAME) {
			return runInitTool(args.cwd ?? process.cwd(), args.extraArgs ?? []);
		}
		return {
			content: [
				{
					type: "text" as const,
					text: `Unknown tool: ${request.params.name}`,
				},
			],
			isError: true,
		};
	});

	return server;
}

/**
 * Connect the MCP server over stdio.
 */
export async function startMcpServer(): Promise<void> {
	const server = createMcpServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
