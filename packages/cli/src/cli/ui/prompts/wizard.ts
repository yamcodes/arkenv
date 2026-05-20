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
	const defaultProjectName = path.basename(process.cwd());

	let projectName: string;
	if (defaults?.name) {
		projectName = defaults.name;
	} else if (!isYes) {
		const name = await text({
			message: "Project name:",
			placeholder: defaultProjectName,
			initialValue: "",
		});

		const nameResult = handlePrompt(name);
		if (nameResult === null) return null;
		projectName = nameResult || defaultProjectName;
	} else {
		projectName = defaultProjectName;
	}

	if (projectName === ".") {
		projectName = defaultProjectName;
	}

	let exampleId = defaults?.example;

	if (!exampleId && !isYes) {
		const selected = await steps.example(examples)();
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

	const results: any = { mode: "existing" };

	const stepsToRun: {
		key: string;
		fn: (ctx: { results: any }) => Promise<any>;
	}[] = [
		{
			key: "overwriteEnvSchemaFile",
			fn: () => steps.overwriteEnvSchemaFile(defaultEnvPath)(),
		},
		{ key: "framework", fn: () => steps.framework(defaults)() },
		{
			key: "bunBuild",
			fn: ({ results }) =>
				results.framework === "bun-fullstack"
					? steps.bunBuild(
							defaults?.bunFeatures?.includes("build") ||
								(results.framework === "bun-fullstack" &&
									defaults?.framework === "bun-fullstack" &&
									defaults?.bunFeatures?.includes("build")),
						)()
					: Promise.resolve(undefined),
		},
		{ key: "useDefaultPath", fn: () => steps.useDefaultPath(defaultEnvPath)() },
		{ key: "path", fn: (ctx) => steps.path(defaultEnvPath)(ctx) },
		{
			key: "installTypeDefinitions",
			fn: (ctx) => steps.installTypeDefinitions(ctx as any),
		},
		{ key: "envDtsHandling", fn: (ctx) => steps.envDtsHandling(ctx as any) },
		{ key: "validator", fn: () => steps.validator() },
		{
			key: "useEnvExample",
			fn: () => steps.useEnvExample(detectedKeys, keysSource)(),
		},
	];

	for (const { key, fn } of stepsToRun) {
		const result = handlePrompt(await fn({ results }));
		if (result === null) {
			return null;
		}
		results[key] = result;
	}

	const bunFeatures: ProjectOptions["bunFeatures"] =
		results.framework === "bun-fullstack"
			? results.bunBuild
				? ["serve", "build"]
				: ["serve"]
			: undefined;

	return shake<ProjectOptions>({
		...results,
		bunFeatures,
		language: "ts",
		installSkill: false,
		envKeys: results.useEnvExample ? (detectedKeys ?? undefined) : undefined,
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
