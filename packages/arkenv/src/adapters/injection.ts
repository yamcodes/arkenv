import fsp from "node:fs/promises";
import path from "node:path";
import { logBuildErrorWithCause, logErrorWithCauseVia } from "@repo/utils";
import dedent from "dedent";
import type { LoggerPort } from "@/shared/ports";

const MARKER = "// @arkenv-types";

export async function safeAppend(
	dtsPath: string,
	schemaPath: string,
	framework: "vite" | "bun-fullstack",
	logger?: Pick<LoggerPort, "error">,
): Promise<boolean> {
	try {
		const content = await fsp.readFile(dtsPath, "utf-8");
		const existingType =
			framework === "vite" ? "ImportMetaEnvAugmented" : "ProcessEnvAugmented";

		if (content.includes(MARKER) || content.includes(existingType)) {
			return false;
		}

		const dtsDir = path.dirname(dtsPath);
		const relativeSchemaPath = path
			.relative(dtsDir, schemaPath)
			.replace(/\.(ts|js|tsx|jsx)$/, "")
			.split(path.sep)
			.join("/");

		// Ensure it starts with ./ or ../
		const importPath = relativeSchemaPath.startsWith(".")
			? relativeSchemaPath
			: `./${relativeSchemaPath}`;

		const template =
			framework === "vite"
				? viteInjectionTemplate(importPath)
				: bunInjectionTemplate(importPath);

		const separator = content.endsWith("\n") ? "" : "\n";
		await fsp.appendFile(
			dtsPath,
			`${separator}\n${MARKER}\n${template}\n`,
			"utf-8",
		);
		return true;
	} catch (e) {
		const header = `Failed to append to ${dtsPath}`;
		if (logger) {
			logErrorWithCauseVia(logger.error.bind(logger), header, e);
		} else {
			logBuildErrorWithCause(header, e);
		}
		return false;
	}
}

function viteInjectionTemplate(importPath: string) {
	return dedent /* ts */`
		type ImportMetaEnvAugmented = import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
			typeof import("${importPath}").Env
		>;

		interface ImportMetaEnv extends ImportMetaEnvAugmented {}

		interface ImportMeta {
			readonly env: ImportMetaEnv;
		}
	`;
}

function bunInjectionTemplate(importPath: string) {
	return dedent /* ts */`
		type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
			typeof import("${importPath}").Env
		>;

		declare namespace NodeJS {
			interface ProcessEnv extends ProcessEnvAugmented {}
		}
	`;
}
