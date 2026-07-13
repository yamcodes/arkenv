import fs from "node:fs";
import path from "node:path";
import {
	extractClientKeys,
	extractSharedKeys,
	resolveLayout,
} from "@arkenv/build";
import { resolveBuildLog } from "@repo/log";
import { extractKeys } from "./extract";
import {
	generateClientFactoryCode,
	generateFactoryCode,
	generateFlatFactoryCode,
} from "./generate";
import { normalizeLayout } from "./layout";
import type { ArkEnvConfigOptions } from "./types";

function detectStandard(content: string, forceStandard?: boolean): boolean {
	if (forceStandard) return true;
	return (
		content.includes("@arkenv/standard") || content.includes("arkenv/standard")
	);
}

/**
 * Run code generation to read the schema file and generate the env.gen.ts factory.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param outputPath The absolute path to the generated output file
 * @param layoutOption The explicit layout to use; auto-detected from the filesystem when omitted
 * @param forceStandard Force standard mode code generation
 * @throws An error if strict layout files are missing when `layoutOption` is `"strict"`
 */
export function runCodegen(
	schemaPath: string,
	outputPath: string,
	layoutOption?: ArkEnvConfigOptions["layout"],
	forceStandard?: boolean,
	logOptions?: Pick<ArkEnvConfigOptions, "logger" | "logLevel">,
) {
	const normalizedLayout = normalizeLayout(
		layoutOption,
		resolveBuildLog(logOptions),
	);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
	);

	let generatedCode = "";
	if (resolvedLayout === "strict") {
		const clientPath = path.join(baseDir, "client.ts");
		const sharedPath = path.join(baseDir, "internal", "shared.ts");

		const clientContent = fs.existsSync(clientPath)
			? fs.readFileSync(clientPath, "utf-8")
			: "";
		const sharedContent = fs.existsSync(sharedPath)
			? fs.readFileSync(sharedPath, "utf-8")
			: "";

		const isStandard =
			detectStandard(clientContent, forceStandard) ||
			detectStandard(sharedContent, forceStandard);

		const clientKeys = extractClientKeys(clientContent);
		const sharedKeys = extractSharedKeys(sharedContent);

		generatedCode = generateClientFactoryCode(
			clientKeys,
			sharedKeys,
			isStandard,
		);
	} else {
		const fileContent = fs.readFileSync(schemaPath, "utf-8");
		const isStandard = detectStandard(fileContent, forceStandard);

		const { clientKeys, sharedKeys, isLegacy } = extractKeys(fileContent);
		if (isLegacy) {
			generatedCode = generateFactoryCode(clientKeys, sharedKeys, isStandard);
		} else {
			generatedCode = generateFlatFactoryCode(
				clientKeys,
				sharedKeys,
				isStandard,
			);
		}
	}

	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	let shouldWrite = true;
	if (fs.existsSync(outputPath)) {
		const existingContent = fs.readFileSync(outputPath, "utf-8");
		if (existingContent === generatedCode) {
			shouldWrite = false;
		}
	}

	if (shouldWrite) {
		fs.writeFileSync(outputPath, generatedCode, "utf-8");
	}
}
