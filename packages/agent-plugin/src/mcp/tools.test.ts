import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initProject } from "./init";
import { buildPreviewReport, extractSchemaKeys } from "./preview";
import { createMcpServer } from "./server";
import {
	AUDIT_TOOL_NAME,
	INIT_TOOL_NAME,
	PREVIEW_TOOL_NAME,
	runAuditTool,
	runPreviewTool,
} from "./tools";

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

	it("preview tool returns schema keys and example presence", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "arkenv-preview-"));
		await writeFile(
			path.join(dir, "env.ts"),
			`import arkenv from "@arkenv/core";
export const env = arkenv({
  DATABASE_URL: "string.url",
  PORT: "number.port = 3000",
  NEXT_PUBLIC_APP_URL: "string.url",
});
`,
		);
		await writeFile(
			path.join(dir, ".env.example"),
			"DATABASE_URL=\nPORT=\n",
		);
		const result = await runPreviewTool(dir);
		const report = result.structuredContent as {
			rows: Array<{ key: string; inExample: boolean | null; boundary: string }>;
			schemaPath: string | null;
		};
		expect(report.schemaPath).toBe("env.ts");
		expect(report.rows.map((r) => r.key)).toEqual(
			expect.arrayContaining([
				"DATABASE_URL",
				"PORT",
				"NEXT_PUBLIC_APP_URL",
			]),
		);
		const publicRow = report.rows.find((r) => r.key === "NEXT_PUBLIC_APP_URL");
		expect(publicRow?.boundary).toBe("public");
		expect(publicRow?.inExample).toBe(false);
	});

	it("createMcpServer registers tools", () => {
		const server = createMcpServer();
		expect(server).toBeDefined();
		expect(AUDIT_TOOL_NAME).toBe("audit");
		expect(INIT_TOOL_NAME).toBe("init");
		expect(PREVIEW_TOOL_NAME).toBe("preview");
	});
});

describe("extractSchemaKeys", () => {
	it("pulls UPPER_SNAKE keys from an arkenv object literal", () => {
		expect(
			extractSchemaKeys(`
export const env = arkenv({
  DATABASE_URL: "string",
  port: "number",
  CI: "boolean = false",
});
`),
		).toEqual(["DATABASE_URL", "CI"]);
		expect(
			extractSchemaKeys(
				`export const env = arkenv({ DATABASE_URL: "string", PORT: "number" });`,
			),
		).toEqual(["DATABASE_URL", "PORT"]);
	});
});

describe("buildPreviewReport", () => {
	it("notes when no schema exists", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "arkenv-preview-empty-"));
		const report = await buildPreviewReport(dir);
		expect(report.schemaPath).toBeNull();
		expect(report.rows).toEqual([]);
		expect(report.note).toMatch(/No env\.ts/);
	});
});
