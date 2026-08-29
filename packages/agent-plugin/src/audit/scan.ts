import path from "node:path";
import ts from "typescript";
import {
	hasLegacyAmbient,
	hasPublicPrefix,
	isClientFile,
	isEnvModule,
	isPrefixViolation,
} from "./rules";
import type { AuditDiagnostic, AuditReport } from "./types";
import { collectSourceFiles } from "./walk";

/**
 * Audit a project tree for unvalidated env access, secret leaks, prefix
 * violations, and leftover v0 ambient `.d.ts` augmentations.
 *
 * @param root Project root directory
 * @returns Structured diagnostic report
 */
export async function auditProject(root: string): Promise<AuditReport> {
	const files = await collectSourceFiles(root);
	const diagnostics: AuditDiagnostic[] = [];
	for (const file of files) {
		diagnostics.push(...auditSource(root, file.filePath, file.source));
	}
	return { diagnostics };
}

/**
 * Audit a single source string.
 *
 * @param root Project root used to relativize `file`
 * @param filePath Absolute path of the file
 * @param source File contents
 * @returns Diagnostics for this file
 */
export function auditSource(
	root: string,
	filePath: string,
	source: string,
): AuditDiagnostic[] {
	const relative = path.relative(root, filePath) || filePath;
	const diagnostics: AuditDiagnostic[] = [];
	const scriptKind = scriptKindFor(filePath);
	const sf = ts.createSourceFile(
		filePath,
		source,
		ts.ScriptTarget.Latest,
		true,
		scriptKind,
	);
	const envModule = isEnvModule(filePath);
	const client = isClientFile(filePath, source);
	const envImport = hasCanonicalEnvImport(sf);

	if (hasLegacyAmbient(source)) {
		const loc = locationOfLegacy(sf, source);
		diagnostics.push({
			file: relative,
			line: loc.line,
			character: loc.character,
			severity: "error",
			ruleId: "legacy-ambient",
			message:
				'Legacy ambient ProcessEnv / ImportMetaEnv augmentation. v1 uses `import { env } from "./env"` with no `.d.ts` glob.',
			suggestedFix:
				"Delete the ambient augmentation and import `{ env }` from the canonical env module instead.",
		});
	}

	const visit = (node: ts.Node, parent: ts.Node | undefined): void => {
		if (envModule) {
			const schemaKey = objectLiteralEnvKey(node);
			if (schemaKey && isPrefixViolation(schemaKey)) {
				const { line, character } = sf.getLineAndCharacterOfPosition(
					node.getStart(),
				);
				diagnostics.push({
					file: relative,
					line: line + 1,
					character: character + 1,
					severity: "error",
					ruleId: "prefix-violation",
					message: `Public prefix on secret-looking key '${schemaKey}'.`,
					suggestedFix: `Rename '${schemaKey}' to a server-only key without NEXT_PUBLIC_, NUXT_PUBLIC_, VITE_, or BUN_PUBLIC_.`,
				});
			}
		}

		const envAccess = readEnvAccess(node, parent);
		if (envAccess) {
			const { key, via, pos } = envAccess;
			const { line, character } = sf.getLineAndCharacterOfPosition(pos);
			const loc = { line: line + 1, character: character + 1 };

			if (key && isPrefixViolation(key)) {
				diagnostics.push({
					file: relative,
					...loc,
					severity: "error",
					ruleId: "prefix-violation",
					message: `Public prefix on secret-looking key '${key}'.`,
					suggestedFix: `Move '${key}' to a server-only name without NEXT_PUBLIC_, NUXT_PUBLIC_, VITE_, or BUN_PUBLIC_, and keep it off the client schema.`,
				});
			}

			if (via !== "env" && !envModule) {
				diagnostics.push({
					file: relative,
					...loc,
					severity: "error",
					ruleId: "unvalidated-access",
					message: `Unvalidated ${via} access${key ? ` of '${key}'` : ""}. Use the canonical env object.`,
					suggestedFix: key
						? `Replace with \`env.${key}\` after \`import { env } from "./env"\`.`
						: 'Replace with `import { env } from "./env"` and read named keys from `env`.',
				});
			}

			if (
				client &&
				key &&
				!hasPublicPrefix(key) &&
				!envModule &&
				(via !== "env" || envImport)
			) {
				diagnostics.push({
					file: relative,
					...loc,
					severity: "error",
					ruleId: "secret-leak",
					message: `Server-only key '${key}' referenced in a client module.`,
					suggestedFix: `Keep '${key}' on the server entry. Expose a public-prefixed key if the client must read it.`,
				});
			}
		}
		ts.forEachChild(node, (child) => visit(child, node));
	};

	visit(sf, undefined);
	return diagnostics;
}

type EnvVia = "process.env" | "import.meta.env" | "env";

type EnvAccess = {
	key: string | undefined;
	via: EnvVia;
	pos: number;
};

function objectLiteralEnvKey(node: ts.Node): string | undefined {
	if (
		!ts.isPropertyAssignment(node) &&
		!ts.isShorthandPropertyAssignment(node)
	) {
		return undefined;
	}
	const name = node.name;
	if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
		return name.text;
	}
	return undefined;
}

function isWrapperAccess(parent: ts.Node | undefined, node: ts.Node): boolean {
	if (!parent) return false;
	if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
		return true;
	}
	if (ts.isElementAccessExpression(parent) && parent.expression === node) {
		return true;
	}
	return false;
}

function readEnvAccess(
	node: ts.Node,
	parent: ts.Node | undefined,
): EnvAccess | undefined {
	if (ts.isPropertyAccessExpression(node)) {
		if (isProcessEnvExpr(node.expression)) {
			return {
				key: node.name.text,
				via: "process.env",
				pos: node.getStart(),
			};
		}
		if (isImportMetaEnvExpr(node.expression)) {
			return {
				key: node.name.text,
				via: "import.meta.env",
				pos: node.getStart(),
			};
		}
		if (ts.isIdentifier(node.expression) && node.expression.text === "env") {
			return { key: node.name.text, via: "env", pos: node.getStart() };
		}
	}

	if (ts.isElementAccessExpression(node)) {
		const key = stringLiteralKey(node.argumentExpression);
		if (isProcessEnvExpr(node.expression)) {
			return { key, via: "process.env", pos: node.getStart() };
		}
		if (isImportMetaEnvExpr(node.expression)) {
			return { key, via: "import.meta.env", pos: node.getStart() };
		}
		if (ts.isIdentifier(node.expression) && node.expression.text === "env") {
			return { key, via: "env", pos: node.getStart() };
		}
	}

	if (isProcessEnvExpr(node) && !isWrapperAccess(parent, node)) {
		return { key: undefined, via: "process.env", pos: node.getStart() };
	}
	if (isImportMetaEnvExpr(node) && !isWrapperAccess(parent, node)) {
		return { key: undefined, via: "import.meta.env", pos: node.getStart() };
	}

	return undefined;
}

function isProcessEnvExpr(node: ts.Node): boolean {
	return (
		ts.isPropertyAccessExpression(node) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "process" &&
		node.name.text === "env"
	);
}

function isImportMetaEnvExpr(node: ts.Node): boolean {
	return (
		ts.isPropertyAccessExpression(node) &&
		ts.isMetaProperty(node.expression) &&
		node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
		node.expression.name.text === "meta" &&
		node.name.text === "env"
	);
}

function stringLiteralKey(node: ts.Expression | undefined): string | undefined {
	if (!node) return undefined;
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		return node.text;
	}
	return undefined;
}

function hasCanonicalEnvImport(sf: ts.SourceFile): boolean {
	for (const stmt of sf.statements) {
		if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
		const spec = stmt.moduleSpecifier;
		if (!ts.isStringLiteral(spec)) continue;
		if (!/env(?:\/(?:client|server))?$/.test(spec.text.replace(/\\/g, "/"))) {
			continue;
		}
		const named = stmt.importClause.namedBindings;
		if (named && ts.isNamedImports(named)) {
			if (named.elements.some((el) => el.name.text === "env")) return true;
		}
		if (stmt.importClause.name?.text === "env") return true;
	}
	return false;
}

function scriptKindFor(filePath: string): ts.ScriptKind {
	if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
	if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
	if (
		filePath.endsWith(".js") ||
		filePath.endsWith(".mjs") ||
		filePath.endsWith(".cjs")
	) {
		return ts.ScriptKind.JS;
	}
	return ts.ScriptKind.TS;
}

function locationOfLegacy(
	sf: ts.SourceFile,
	source: string,
): { line: number; character: number } {
	const idx = Math.max(
		source.search(
			/ProcessEnvAugmented|ImportMetaEnvAugmented|interface\s+ProcessEnv|interface\s+ImportMetaEnv/,
		),
		0,
	);
	const { line, character } = sf.getLineAndCharacterOfPosition(idx);
	return { line: line + 1, character: character + 1 };
}
