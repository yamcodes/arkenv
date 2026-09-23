import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	RESOURCE_MIME_TYPE,
	registerAppResource,
	registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { version } from "../../package.json";
import {
	AUDIT_TOOL_NAME,
	INIT_TOOL_NAME,
	PREVIEW_RESOURCE_URI,
	PREVIEW_TOOL_NAME,
	runAuditTool,
	runInitTool,
	runPreviewTool,
} from "./tools";

const cwdSchema = z.object({
	cwd: z
		.string()
		.optional()
		.describe("Project root. Defaults to the current working directory."),
});

/**
 * Create the ArkEnv MCP server with `preview` (MCP App), `audit`, and `init`.
 *
 * @returns Configured MCP server (not yet connected)
 */
export function createMcpServer(): McpServer {
	const server = new McpServer({
		name: "arkenv",
		version,
	});

	registerAppTool(
		server,
		PREVIEW_TOOL_NAME,
		{
			title: "ArkEnv Live Preview",
			description:
				"Show an env health board: schema keys, .env.example presence, and check fail reasons (redacted). Always pass cwd as the absolute project root that contains env.ts / src/env.ts — the MCP server process cwd is often wrong. Renders an MCP App View when the host supports MCP Apps. In Cursor, if the widget disappears after the turn, expand the “Worked for …” / “Explored …” group — Cursor currently collapses MCP Apps into tool traces.",
			inputSchema: cwdSchema,
			_meta: { ui: { resourceUri: PREVIEW_RESOURCE_URI } },
		},
		async ({ cwd }) => runPreviewTool(cwd ?? process.cwd()),
	);

	registerAppResource(
		server,
		PREVIEW_RESOURCE_URI,
		PREVIEW_RESOURCE_URI,
		{ mimeType: RESOURCE_MIME_TYPE },
		async () => {
			const html = await readLivePreviewHtml();
			return {
				contents: [
					{
						uri: PREVIEW_RESOURCE_URI,
						mimeType: RESOURCE_MIME_TYPE,
						text: html,
					},
				],
			};
		},
	);

	server.registerTool(
		AUDIT_TOOL_NAME,
		{
			description:
				"Scan the project for unvalidated process.env / import.meta.env access, server secrets in client modules, public-prefix violations, and leftover v0 ambient .d.ts augmentations.",
			inputSchema: cwdSchema,
		},
		async ({ cwd }) => runAuditTool(cwd ?? process.cwd()),
	);

	server.registerTool(
		INIT_TOOL_NAME,
		{
			description:
				"Scaffold ArkEnv by running `arkenv init --agent`. Never pass --force unless a previous refusal listed it in nextActions.",
			inputSchema: z.object({
				cwd: z
					.string()
					.optional()
					.describe("Project root. Defaults to the current working directory."),
				extraArgs: z
					.array(z.string())
					.optional()
					.describe(
						"Extra CLI flags such as --force after a documented refusal.",
					),
			}),
		},
		async ({ cwd, extraArgs }) =>
			runInitTool(cwd ?? process.cwd(), extraArgs ?? []),
	);

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

async function readLivePreviewHtml(): Promise<string> {
	const here = path.dirname(fileURLToPath(import.meta.url));
	const candidates = [
		path.join(here, "live-preview.html"),
		path.join(process.cwd(), "dist", "live-preview.html"),
	];
	for (const candidate of candidates) {
		try {
			const html = await readFile(candidate, "utf8");
			// Never serve the vite entry (references ./src/ui/*.ts) — that mounts a blank iframe.
			if (html.includes("src/ui/live-preview.ts")) continue;
			if (!html.includes("<script")) continue;
			return html;
		} catch {
			// try next
		}
	}
	return `<!doctype html><html><body style="font:14px system-ui;padding:1rem">
<p><strong>Live Preview UI missing.</strong> Run <code>nub run build</code> in <code>@arkenv/agent-plugin</code>, then reload the MCP server.</p>
</body></html>`;
}
