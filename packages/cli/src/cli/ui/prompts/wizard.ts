import path from "node:path";
import { cancel, isCancel, text } from "@clack/prompts";
import { shake } from "radashi";
import type { ProjectOptions } from "@/features/scaffold";
import type { Example } from "@/shared/clients";
import type { ParsedTsConfig } from "@/shared/ports";
import { steps } from "./steps";

/**
 * Runs the appropriate init prompt flow for a new or existing project.
 */
export async function runPromptWizard(
	defaults?: Partial<
		Pick<
			ProjectOptions,
			"mode" | "example" | "name" | "framework" | "bunFeatures"
		>
	> & {
		examples?: Example[];
		defaultEnvPath?: string;
		tsConfig?: ParsedTsConfig | null;
		envKeys?: string[];
		envKeysSource?: ".env.example" | "project";
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
 * Collects options for scaffolding a new project from an example example.
 */
async function runNewProjectWizard(
	defaults?: Partial<Pick<ProjectOptions, "example" | "name">> & {
		examples?: Example[];
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const examples = defaults?.examples || [];
	const defaultProjectName = "arkenv-project";

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

		const nameResult = handlePrompt(name);
		if (nameResult === null) return null;
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
		const selectedResult = handlePrompt(selected);
		if (selectedResult === null) return null;
		exampleId = selectedResult;
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
}

/**
 * Collects options for adding ArkEnv to a project that already has `package.json`.
 */
async function runExistingProjectWizard(
	defaults?: Partial<Pick<ProjectOptions, "framework" | "bunFeatures">> & {
		defaultEnvPath?: string;
		tsConfig?: ParsedTsConfig | null;
		envKeys?: string[];
		envKeysSource?: ".env.example" | "project";
		hasTypeFile?: boolean;
		hasEnvSchemaFile?: boolean;
	},
	isYes = false,
): Promise<ProjectOptions | null> {
	const defaultEnvPath = defaults?.defaultEnvPath || "./src/env.ts";
	const detectedKeys = defaults?.envKeys || null;
	const keysSource = defaults?.envKeysSource || ".env.example";

	if (isYes) {
		const framework = defaults?.framework || "vanilla";
		let envDtsHandling: ProjectOptions["envDtsHandling"];

		if (framework === "vite" || framework === "bun-fullstack") {
			envDtsHandling = defaults?.hasTypeFile ? "append" : "overwrite";
		}

		return shake({
			mode: "existing",
			path: defaultEnvPath,
			validator: "arktype",
			framework,
			bunFeatures:
				framework === "bun-fullstack"
					? (defaults?.bunFeatures ?? ["serve"])
					: undefined,
			language: "ts",
			overwriteEnvSchemaFile: true,
			installTypeDefinitions: framework !== "vanilla",
			installSkill: false,
			envDtsHandling,
			envKeys: detectedKeys ?? undefined,
		});
	}

	// 1. overwriteEnvSchemaFile
	const overwriteEnvSchemaFile = handlePrompt(
		await steps.overwriteEnvSchemaFile({
			hasEnvSchemaFile: defaults?.hasEnvSchemaFile ?? false,
			defaultPath: defaultEnvPath,
		}),
	);
	if (overwriteEnvSchemaFile === null) return null;

	// 2. framework
	const framework = handlePrompt(
		await steps.framework({
			framework: defaults?.framework,
		}),
	);
	if (framework === null) return null;

	// 3. bunBuild
	let bunBuild: boolean | undefined;
	if (framework === "bun-fullstack") {
		const defaultBunBuild =
			defaults?.bunFeatures?.includes("build") ||
			(defaults?.framework === "bun-fullstack" &&
				defaults?.bunFeatures?.includes("build"));
		const bunBuildResult = handlePrompt(
			await steps.bunBuild({
				initialValue: defaultBunBuild,
			}),
		);
		if (bunBuildResult === null) return null;
		bunBuild = bunBuildResult;
	}

	// 4. useDefaultPath
	const useDefaultPath = handlePrompt(
		await steps.useDefaultPath({
			defaultEnvPath,
		}),
	);
	if (useDefaultPath === null) return null;

	// 5. path
	const envPath = handlePrompt(
		await steps.path({
			useDefaultPath,
			defaultEnvPath,
		}),
	);
	if (envPath === null) return null;

	// 6. installTypeDefinitions
	const installTypeDefinitions = handlePrompt(
		await steps.installTypeDefinitions({
			framework,
			hasTypeFile: defaults?.hasTypeFile ?? false,
		}),
	);
	if (installTypeDefinitions === null) return null;

	// 7. envDtsHandling
	const envDtsHandling = handlePrompt(
		await steps.envDtsHandling({
			framework,
			installTypeDefinitions,
			hasTypeFile: defaults?.hasTypeFile ?? false,
		}),
	);
	if (envDtsHandling === null) return null;

	// 8. validator
	const validator = handlePrompt(await steps.validator());
	if (validator === null) return null;

	// 9. useEnvExample
	const useEnvExample = handlePrompt(
		await steps.useEnvExample({
			detectedKeys,
			keysSource,
		}),
	);
	if (useEnvExample === null) return null;

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
		path: envPath,
		installTypeDefinitions,
		envDtsHandling,
		validator,
		bunFeatures,
		language: "ts",
		installSkill: false,
		envKeys: useEnvExample ? (detectedKeys ?? undefined) : undefined,
	});
}

/**
 * Normalizes prompt cancellations into `null` so wizard callers can stop safely.
 */
function handlePrompt<T>(value: T | symbol | null): T | null {
	if (value === null || isCancel(value)) {
		cancel("Operation cancelled");
		return null;
	}
	return value as T;
}
