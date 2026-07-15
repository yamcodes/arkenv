import path from "node:path";
import { cancel, confirm, isCancel, text } from "@clack/prompts";
import { shake } from "radashi";
import type { ProjectOptions } from "@/features/scaffold";
import type { Example } from "@/shared/clients";
import type { ParsedTsConfig } from "@/shared/ports";
import { code } from "@/shared/visuals";
import { steps } from "./steps";

type HasTypeFileAtPath = (options: {
	framework: ProjectOptions["framework"];
	envPath: string;
}) => boolean | Promise<boolean>;

type ExistingProjectDefaults = Partial<
	Pick<ProjectOptions, "framework" | "bunFeatures" | "disableCodegen" | "hostPreset">
> & {
	defaultEnvPath?: string;
	tsConfig?: ParsedTsConfig | null;
	envKeys?: string[];
	envKeysSource?: ".env.example" | "project";
	hasTypeFileAtPath?: HasTypeFileAtPath;
	hasTypeFile?: boolean;
	hasEnvSchemaFile?: boolean;
	isStrict?: boolean;
	isSimple?: boolean;
	isFlat?: boolean;
};

/**
 * Run the appropriate init prompt flow for a new or existing project.
 *
 * @param defaults Optional default values and configuration for the wizard
 * @param isYes Whether to run in non-interactive/auto-confirm mode
 * @returns The project options or null if cancelled
 */
export async function runPromptWizard(
	defaults?: Partial<
		Pick<
			ProjectOptions,
			| "mode"
			| "example"
			| "name"
			| "framework"
			| "bunFeatures"
			| "disableCodegen"
			| "hostPreset"
		>
	> & {
		examples?: Example[];
		defaultEnvPath?: string;
		tsConfig?: ParsedTsConfig | null;
		envKeys?: string[];
		envKeysSource?: ".env.example" | "project";
		hasTypeFileAtPath?: HasTypeFileAtPath;
		hasTypeFile?: boolean;
		hasEnvSchemaFile?: boolean;
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const mode = defaults?.mode || "existing";

	if (mode === "new") {
		return runNewProjectWizard(defaults, isYes);
	}

	return runExistingProjectWizard(defaults, isYes);
}

/**
 * Collect option for scaffolding a new project from an example.
 *
 * @param defaults Optional default values for the new project
 * @param isYes Whether to run in non-interactive/auto-confirm mode
 * @returns The project options or null if cancelled
 * @throws An error if an unknown example ID is specified
 */
async function runNewProjectWizard(
	defaults?: Partial<Pick<ProjectOptions, "example" | "name">> & {
		examples?: Example[];
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const examples = defaults?.examples || [];
	const defaultProjectName = "arkenv-project";

	try {
		let projectName: string;
		if (defaults?.name) {
			const trimmed = defaults.name.trim();
			if (
				trimmed === "." ||
				trimmed === "./" ||
				path.resolve(process.cwd(), trimmed) === process.cwd()
			) {
				projectName = ".";
			} else {
				projectName = trimmed;
			}
		} else if (!isYes) {
			const name = await text({
				message: "Project name:",
				placeholder: defaultProjectName,
				defaultValue: defaultProjectName,
			});

			const nameResult = unwrapPrompt(name);
			const trimmed = (nameResult || defaultProjectName).trim();
			if (
				trimmed === "." ||
				trimmed === "./" ||
				path.resolve(process.cwd(), trimmed) === process.cwd()
			) {
				projectName = ".";
			} else {
				projectName = trimmed;
			}
		} else {
			projectName = defaultProjectName;
		}

		let exampleId = defaults?.example;

		if (!exampleId && !isYes) {
			const selected = await steps.example({ examples });
			exampleId = unwrapPrompt(selected);
		} else if (!exampleId && isYes) {
			exampleId = "basic";
		}

		const example = examples.find((t) => t.id === exampleId);
		if (!example) {
			const availableExamples = examples.map((t) => t.id).join(", ");
			throw new Error(
				`Unknown example ${exampleId}. Available examples: ${availableExamples}`,
			);
		}

		return {
			mode: "new",
			example: example.id,
			name: projectName,
			path: "./src/env.ts",
			validator: "arktype",
			framework: example.framework,
			language: "ts",
			installSkill: false,
		};
	} catch (error) {
		if (error instanceof CancelError) {
			return null;
		}
		throw error;
	}
}

/**
 * Collect option for adding ArkEnv to a project that already has `package.json`.
 *
 * @param defaults Optional default values for the existing project
 * @param isYes Whether to run in non-interactive/auto-confirm mode
 * @returns The project options or null if cancelled
 */
async function runExistingProjectWizard(
	defaults?: ExistingProjectDefaults,
	isYes = false,
): Promise<ProjectOptions | null> {
	const defaultEnvPath = defaults?.defaultEnvPath || "./src/env.ts";
	const detectedKeys = defaults?.envKeys || null;
	const keysSource = defaults?.envKeysSource || ".env.example";

	if (isYes) {
		const framework = defaults?.framework || "vanilla";
		let layout: "strict" | "simple" | "flat" | undefined;
		if (framework === "nextjs" || framework === "nuxt") {
			if (defaults?.isStrict) {
				layout = "strict";
			} else if (defaults?.isSimple) {
				layout = "simple";
			} else if (defaults?.isFlat) {
				layout = "flat";
			} else {
				layout = framework === "nextjs" ? "flat" : "simple";
			}
		}
		const hasTypeFile = await getHasTypeFile(
			defaults,
			framework,
			defaultEnvPath,
		);
		let envDtsHandling: ProjectOptions["envDtsHandling"];

		if (framework === "vite" || framework === "bun-fullstack") {
			envDtsHandling = hasTypeFile ? "append" : "overwrite";
		}

		return shake({
			mode: "existing",
			path: defaultEnvPath,
			validator: "arktype",
			framework,
			layout,
			bunFeatures:
				framework === "bun-fullstack"
					? (defaults?.bunFeatures ?? ["serve"])
					: undefined,
			language: "ts",
			overwriteEnvSchemaFile: true,
			installTypeDefinitions:
				framework === "vite" || framework === "bun-fullstack",
			installSkill: false,
			envDtsHandling,
			envKeys: detectedKeys ?? undefined,
			disableCodegen: defaults?.disableCodegen ?? false,
			wrapNextjsConfig: framework === "nextjs" ? true : undefined,
			hostPreset: defaults?.hostPreset || "none",
		});
	}

	try {
		// 1. overwriteEnvSchemaFile
		const overwriteEnvSchemaFile = unwrapPrompt(
			await steps.overwriteEnvSchemaFile({
				hasEnvSchemaFile: defaults?.hasEnvSchemaFile ?? false,
				defaultPath: defaultEnvPath,
			}),
		);

		// 2. framework
		const framework = unwrapPrompt(
			await steps.framework({
				framework: defaults?.framework,
			}),
		);

		// Next.js & Nuxt layout prompt
		let layout: "strict" | "simple" | "flat" | undefined;
		if (framework === "nextjs" || framework === "nuxt") {
			if (defaults?.isStrict) {
				layout = "strict";
			} else if (defaults?.isSimple) {
				layout = "simple";
			} else if (defaults?.isFlat) {
				layout = "flat";
			} else {
				layout = unwrapPrompt(await steps.layout({ framework }));
			}
		}

		// 3. bunBuild
		let bunBuild: boolean | undefined;
		if (framework === "bun-fullstack") {
			const defaultBunBuild = Boolean(defaults?.bunFeatures?.includes("build"));
			bunBuild = unwrapPrompt(
				await steps.bunBuild({
					initialValue: defaultBunBuild,
				}),
			);
		}

		// Next.js & Nuxt codegen prompt
		let disableCodegen: boolean | undefined = defaults?.disableCodegen;
		if (framework === "nuxt") {
			disableCodegen = true;
		} else if (framework === "nextjs" && disableCodegen === undefined) {
			const useCodegen = unwrapPrompt(
				await steps.nextjsCodegen({
					initialValue: true,
					framework,
				}),
			);
			disableCodegen = !useCodegen;
		}

		// Next.js config wrapping prompt
		let wrapNextjsConfig: boolean | undefined;
		if (framework === "nextjs" && !disableCodegen) {
			const answer = await confirm({
				message: `Would you like to wrap your Next.js config with ${code("withArkEnv")}?`,
				initialValue: true,
				active: "Yes (Recommended)",
				inactive: "No",
			});
			if (isCancel(answer)) {
				cancel("Operation cancelled");
				throw new CancelError();
			}
			wrapNextjsConfig = answer;
		}

		// 4. useDefaultPath
		const useDefaultPath = unwrapPrompt(
			await steps.useDefaultPath({
				defaultEnvPath,
			}),
		);

		// 5. path
		const envPath = unwrapPrompt(
			await steps.path({
				useDefaultPath,
				defaultEnvPath,
			}),
		);
		const hasTypeFile = await getHasTypeFile(defaults, framework, envPath);

		// 6. installTypeDefinitions
		const installTypeDefinitions = unwrapPrompt(
			await steps.installTypeDefinitions({
				framework,
				hasTypeFile,
			}),
		);

		// 7. envDtsHandling
		const envDtsHandling = unwrapPrompt(
			await steps.envDtsHandling({
				framework,
				installTypeDefinitions,
				hasTypeFile,
			}),
		);

		// 8. validator
		const validator = unwrapPrompt(await steps.validator());

		// 9. hostPreset
		const hostPreset = defaults?.hostPreset !== undefined
			? defaults.hostPreset
			: unwrapPrompt(
				await steps.hostPreset({
					initialValue: defaults?.hostPreset,
				}),
			);

		// 10. useEnvExample
		const useEnvExample = unwrapPrompt(
			await steps.useEnvExample({
				detectedKeys,
				keysSource,
			}),
		);

		const bunFeatures: ProjectOptions["bunFeatures"] =
			framework === "bun-fullstack"
				? bunBuild
					? ["serve", "build"]
					: ["serve"]
				: undefined;

		return shake({
			mode: "existing",
			overwriteEnvSchemaFile,
			framework,
			layout,
			path: envPath,
			installTypeDefinitions,
			envDtsHandling,
			validator,
			hostPreset,
			bunFeatures,
			language: "ts",
			installSkill: false,
			envKeys: useEnvExample ? (detectedKeys ?? undefined) : undefined,
			disableCodegen,
			wrapNextjsConfig,
		});
	} catch (error) {
		if (error instanceof CancelError) {
			return null;
		}
		throw error;
	}
}

async function getHasTypeFile(
	defaults: ExistingProjectDefaults | undefined,
	framework: ProjectOptions["framework"],
	envPath: string,
): Promise<boolean> {
	return (
		(await defaults?.hasTypeFileAtPath?.({ framework, envPath })) ??
		defaults?.hasTypeFile ??
		false
	);
}

/**
 * Represent an error thrown when a user cancels a CLI prompt.
 */
class CancelError extends Error {
	constructor() {
		super("Operation cancelled");
	}
}

/**
 * Unwrap a prompt result, throwing a CancelError if the user cancelled the prompt.
 *
 * @param value The prompt result that may be cancelled or null
 * @returns The unwrapped prompt value
 * @throws CancelError If the user cancelled the prompt or if the result is null
 */
function unwrapPrompt<T>(value: T | symbol | null): T {
	if (value === null || isCancel(value)) {
		cancel("Operation cancelled");
		throw new CancelError();
	}
	return value as T;
}
