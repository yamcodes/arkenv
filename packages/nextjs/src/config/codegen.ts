import fs from "node:fs";
import path from "node:path";
import { extractKeys } from "./extract";
import { generateFactoryCode, generateFlatFactoryCode } from "./generate";
import type { ArkEnvConfigOptions } from "./types";

function detectStandard(content: string, forceStandard?: boolean): boolean {
	if (forceStandard) return true;
	return (
		content.includes("@arkenv/standard") || content.includes("arkenv/standard")
	);
}

/**
 * Convert a file path to a relative TypeScript module specifier from `fromDir`.
 *
 * @param fromDir Directory the import is written in
 * @param toFile Absolute path of the target module
 * @returns A relative specifier without a `.ts` / `.tsx` extension
 */
function toModuleSpecifier(fromDir: string, toFile: string): string {
	let rel = path.relative(fromDir, toFile).replace(/\\/g, "/");
	if (!rel.startsWith(".")) {
		rel = `./${rel}`;
	}
	return rel.replace(/\.tsx?$/, "");
}

/**
 * Write `.arkenv/index.ts` so `tsc` can resolve `@/.arkenv` even when the
 * factory file lives at a custom `outputPath`.
 *
 * @param barrelDir Directory for the TypeScript entry (`<projectRoot>/.arkenv`)
 * @param factoryPath Absolute path of the generated factory file
 */
function writeFactoryBarrel(barrelDir: string, factoryPath: string) {
	if (!fs.existsSync(barrelDir)) {
		fs.mkdirSync(barrelDir, { recursive: true });
	}
	const barrelPath = path.join(barrelDir, "index.ts");
	const spec = toModuleSpecifier(barrelDir, factoryPath);
	const barrelCode = `export * from ${JSON.stringify(spec)};\nexport { default } from ${JSON.stringify(spec)};\n`;
	if (
		fs.existsSync(barrelPath) &&
		fs.readFileSync(barrelPath, "utf-8") === barrelCode
	) {
		return;
	}
	fs.writeFileSync(barrelPath, barrelCode, "utf-8");
}

/**
 * Infer the app root from a factory path written into `<root>/.arkenv/`.
 *
 * @param outputPath Absolute path of the generated factory file
 * @returns The parent of `.arkenv`, or `undefined` when the file is elsewhere
 */
function projectRootFromDefaultOutput(outputPath: string): string | undefined {
	const outputDir = path.dirname(outputPath);
	if (path.basename(outputDir) !== ".arkenv") return undefined;
	return path.dirname(outputDir);
}

/**
 * Run code generation to read the schema file and generate the env.gen.ts factory.
 *
 * @param schemaPath The absolute path to the schema file
 * @param outputPath The absolute path to the generated output file
 * @param forceStandard Force standard mode code generation
 * @param _logOptions Reserved for logger options (unused in flat-only codegen)
 * @param projectRoot App root used to keep `.arkenv/index.ts` as the `@/.arkenv` TypeScript entry
 */
export function runCodegen(
	schemaPath: string,
	outputPath: string,
	forceStandard?: boolean,
	_logOptions?: Pick<ArkEnvConfigOptions, "logger" | "logLevel">,
	projectRoot?: string,
) {
	const fileContent = fs.readFileSync(schemaPath, "utf-8");
	const isStandard = detectStandard(fileContent, forceStandard);

	const { clientKeys, sharedKeys, isLegacy } = extractKeys(fileContent);
	const generatedCode = isLegacy
		? generateFactoryCode(clientKeys, sharedKeys, isStandard)
		: generateFlatFactoryCode(clientKeys, sharedKeys, isStandard);

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

	const tsEntryRoot = projectRoot ?? projectRootFromDefaultOutput(outputPath);
	if (tsEntryRoot) {
		writeFactoryBarrel(path.join(tsEntryRoot, ".arkenv"), outputPath);
	}
}
