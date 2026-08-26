export const RULE_IDS = [
	"unvalidated-access",
	"secret-leak",
	"prefix-violation",
	"legacy-ambient",
] as const;

export type RuleId = (typeof RULE_IDS)[number];

export type DiagnosticSeverity = "error" | "warning";

/**
 * Structured diagnostic returned by the ArkEnv AST auditor and MCP `audit` tool.
 */
export type AuditDiagnostic = {
	file: string;
	line: number;
	character: number;
	severity: DiagnosticSeverity;
	ruleId: RuleId;
	message: string;
	suggestedFix: string;
};

export type AuditReport = {
	diagnostics: AuditDiagnostic[];
};

export type AuditOptions = {
	root: string;
};
