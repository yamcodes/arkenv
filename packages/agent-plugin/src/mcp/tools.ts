import { auditProject } from "../audit/scan";
import type { AuditReport } from "../audit/types";
import { initProject } from "./init";

export const AUDIT_TOOL_NAME = "audit";
export const INIT_TOOL_NAME = "init";

export type ToolContent = {
	content: Array<{ type: "text"; text: string }>;
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
		...(result.status === "error" ? { isError: true } : {}),
	};
}
