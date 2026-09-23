import { auditProject } from "../audit/scan";
import type { AuditReport } from "../audit/types";
import { initProject } from "./init";
import { buildPreviewReport, type PreviewReport } from "./preview";

export const AUDIT_TOOL_NAME = "audit";
export const INIT_TOOL_NAME = "init";
export const PREVIEW_TOOL_NAME = "preview";

export const PREVIEW_RESOURCE_URI = "ui://arkenv/live-preview.html";

export type ToolContent = {
	content: Array<{ type: "text"; text: string }>;
	structuredContent?: Record<string, unknown>;
	isError?: boolean;
};

/**
 * Run the MCP `audit` tool against a project root.
 *
 * @param cwd Directory to scan (defaults to `process.cwd()`)
 * @returns MCP content wrapping a structured {@link AuditReport}
 */
export async function runAuditTool(cwd = process.cwd()): Promise<ToolContent> {
	const report: AuditReport = await auditProject(cwd);
	return {
		content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
		structuredContent: report as unknown as Record<string, unknown>,
	};
}

/**
 * Run the MCP `init` tool by delegating to `arkenv init --agent`.
 *
 * @param cwd Project directory
 * @param extraArgs Extra CLI flags
 * @returns MCP content wrapping the CLI JSON / logs
 */
export async function runInitTool(
	cwd = process.cwd(),
	extraArgs: string[] = [],
): Promise<ToolContent> {
	const result = await initProject(cwd, extraArgs);
	return {
		content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
		structuredContent: result as unknown as Record<string, unknown>,
		...(result.status === "error" ? { isError: true } : {}),
	};
}

/**
 * Run the MCP `preview` Live Preview tool (env health board payload).
 *
 * Text `content` is a short summary only — the board lives in `structuredContent`
 * for the MCP App. Dumping full JSON into `content` makes Cursor/agents render a
 * competing markdown table while the widget is collapsed into “Worked for Ns”.
 *
 * @param cwd Project directory
 */
export async function runPreviewTool(
	cwd = process.cwd(),
): Promise<ToolContent> {
	const report: PreviewReport = await buildPreviewReport(cwd);
	return {
		content: [
			{ type: "text", text: summarizePreview(report) },
			// Widget-only recovery when hosts strip structuredContent from the
			// tool-result notification. Keep it on a second block so the model
			// summary stays short.
			{
				type: "text",
				text: `arkenv-preview-json:${JSON.stringify(report)}`,
			},
		],
		structuredContent: report as unknown as Record<string, unknown>,
	};
}

function summarizePreview(report: PreviewReport): string {
	const fail = report.rows.filter((r) => r.status === "fail").length;
	const missing = report.rows.filter((r) => r.status === "missing").length;
	const ok = report.rows.filter((r) => r.status === "ok").length;
	const unknown = report.rows.filter((r) => r.status === "unknown").length;
	const parts = [
		`ArkEnv Live Preview: ${report.rows.length} key(s)`,
		report.schemaPath ? `schema ${report.schemaPath}` : "no schema",
		`ok=${ok} fail=${fail} missing=${missing} unknown=${unknown}`,
		report.checkRan === true
			? "check ran"
			: report.checkRan === false
				? "check unavailable"
				: null,
		`cwd=${report.cwd}`,
	].filter(Boolean) as string[];
	if (report.note) parts.push(report.note);
	parts.push(
		"Open the MCP App widget (expand “Worked for …” / “Explored …” if Cursor collapsed it) for the interactive board.",
	);
	return parts.join(" · ");
}
