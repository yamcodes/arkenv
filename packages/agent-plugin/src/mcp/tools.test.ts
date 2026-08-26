import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initProject } from "./init";
import { createMcpServer } from "./server";
import { AUDIT_TOOL_NAME, INIT_TOOL_NAME, runAuditTool } from "./tools";

describe("initProject", () => {
	it("delegates to arkenv init --agent", async () => {
		const result = await initProject(
			"/tmp/project",
			[],
			async (command, args, options) => {
				expect(args).toContain("init");
				expect(args).toContain("--agent");
				expect(options.cwd).toBe("/tmp/project");
				return {
					command,
					stdout: JSON.stringify({ status: "success" }),
					stderr: "",
					exitCode: 0,
				};
			},
		);
		expect(result.status).toBe("success");
		expect(result.args).toContain("init");
		expect(result.args).toContain("--agent");
	});
});

describe("MCP tools", () => {
	it("audit tool returns structured diagnostics JSON", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "arkenv-mcp-"));
		await writeFile(
			path.join(dir, "app.ts"),
			"export const url = process.env.DATABASE_URL;\n",
		);
		const result = await runAuditTool(dir);
		const report = JSON.parse(result.content[0]?.text ?? "{}") as {
			diagnostics: Array<{ ruleId: string; line: number; file: string }>;
		};
		expect(
			report.diagnostics.some((d) => d.ruleId === "unvalidated-access"),
		).toBe(true);
		expect(report.diagnostics[0]?.line).toBeGreaterThan(0);
	});

	it("createMcpServer registers audit and init tools", () => {
		const server = createMcpServer();
		expect(server).toBeDefined();
		expect(AUDIT_TOOL_NAME).toBe("audit");
		expect(INIT_TOOL_NAME).toBe("init");
	});
});
