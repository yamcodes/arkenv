import path from "node:path";
import { shake } from "radashi";
import { FRAMEWORKS } from "./frameworks";
import type { CollectedState, ScaffoldingPlan } from "./plan";
import { getDlxCommand } from "./scaffold";
import { VALIDATORS } from "./validators";

const exampleEnvDefaults: Record<string, Record<string, string>> = {
	basic: {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"basic-js": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"with-bun": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"with-nextjs": {
		DATABASE_URL: "postgres://localhost:5432/mydb",
		NEXT_PUBLIC_API_URL: "https://api.example.com",
		NODE_ENV: "development",
	},
	"with-nextjs-strict": {
		DATABASE_URL: "postgres://localhost:5432/mydb",
		NEXT_PUBLIC_API_URL: "https://api.example.com",
		NODE_ENV: "development",
	},
	"with-nuxt": {
		DATABASE_URL: "postgres://localhost:5432/mydb",
		NUXT_PUBLIC_API_URL: "https://api.example.com",
		NODE_ENV: "development",
	},
	"with-vite-react": {
		PORT: "3000",
		VITE_MY_VAR: "hello",
		VITE_MY_NUMBER: "42",
		VITE_MY_BOOLEAN: "true",
	},
	"with-bun-react": {
		BUN_PUBLIC_API_URL: "https://api.example.com",
		BUN_PUBLIC_DEBUG: "true",
		NODE_ENV: "development",
	},
	"with-zod": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"with-standard-schema": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
};

/**
 * Strip values from env file content, preserving comments and key names.
 *
 * @param content Raw .env file content.
 * @returns Content with variable values removed.
 */
export function stripValuesFromEnvContent(content: string): string {
	const lines = content.split(/\r?\n/);
	const resultLines: string[] = [];
	let inQuote: string | null = null;

	for (const line of lines) {
		const unescapedLine = line.replace(/\\"/g, "").replace(/\\'/g, "");

		if (inQuote) {
			const quoteCount = (unescapedLine.match(new RegExp(inQuote, "g")) || [])
				.length;
			if (quoteCount % 2 !== 0) {
				inQuote = null;
			}
			continue;
		}

		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			resultLines.push(line);
			continue;
		}

		const match = line.match(
			/^(\s*(?:export\s+)?)([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i,
		);
		if (match) {
			const prefix = match[1];
			const key = match[2];
			const val = match[3].trim();

			resultLines.push(`${prefix}${key}=`);

			const unescapedVal = val.replace(/\\"/g, "").replace(/\\'/g, "");
			if (val.startsWith('"')) {
				const quoteCount = (unescapedVal.match(/"/g) || []).length;
				if (quoteCount % 2 !== 0) {
					inQuote = '"';
				}
			} else if (val.startsWith("'")) {
				const quoteCount = (unescapedVal.match(/'/g) || []).length;
				if (quoteCount % 2 !== 0) {
					inQuote = "'";
				}
			}
		} else {
			resultLines.push(line);
		}
	}

	return resultLines.join("\n");
}

function isIgnored(lines: string[], target: string): boolean {
	return lines.some((line) => {
		const commentIndex = line.indexOf("#");
		const clean = (
			commentIndex !== -1 ? line.slice(0, commentIndex) : line
		).trim();
		if (!clean) return false;

		if (clean === target || clean === `/${target}`) return true;

		if (clean.includes("*")) {
			const regexStr = `^${clean.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/^\//, "/?")}$`;
			try {
				const regex = new RegExp(regexStr);
				return regex.test(target) || regex.test(`/${target}`);
			} catch {
				return false;
			}
		}

		return false;
	});
}

/**
 * Format env defaults as key=value lines.
 *
 * @param defaults Env var name to value map.
 * @returns Serialized .env content with trailing newline.
 */
export function formatEnvContent(defaults: Record<string, string>): string {
	return (
		Object.entries(defaults)
			.map(([k, v]) => `${k}=${v}`)
			.join("\n") + "\n"
	);
}

/**
 * Resolve example-specific env defaults for new project scaffolding.
 *
 * @param example The example template name.
 * @param framework The selected framework.
 * @returns Env var defaults for the example.
 */
export function getEnvDefaultsForExample(
	example: string,
	framework: CollectedState["options"]["framework"],
): Record<string, string> {
	return exampleEnvDefaults[example] ?? FRAMEWORKS[framework].getEnvDefaults();
}

/**
 * Plan .env and .env.example files for existing projects.
 *
 * @param state Collected workspace state.
 * @param plan The scaffolding plan being built.
 */
export function planEnvFiles(
	state: CollectedState,
	plan: ScaffoldingPlan,
): void {
	const { cwd, options, existingFiles } = state;
	const frameworkStrategy = FRAMEWORKS[options.framework];
	const envPath = path.join(cwd, ".env");
	const envExamplePath = path.join(cwd, ".env.example");
	const hasEnv = existingFiles.includes(envPath);
	const hasEnvExample = existingFiles.includes(envExamplePath);

	if (!hasEnv) {
		const content =
			options.envExampleContent !== undefined
				? options.envExampleContent
				: formatEnvContent(frameworkStrategy.getEnvDefaults(options.envKeys));
		plan.files.push({
			path: envPath,
			content,
			action: "create",
			label: "local environment variables",
		});
	}

	if (!hasEnvExample) {
		const content =
			options.envContent !== undefined
				? stripValuesFromEnvContent(options.envContent)
				: formatEnvContent(frameworkStrategy.getEnvDefaults(options.envKeys));
		plan.files.push({
			path: envExamplePath,
			content,
			action: "create",
			label: "environment variables template",
		});
	}
}

/**
 * Plan .gitignore updates for existing projects.
 *
 * @param state Collected workspace state.
 * @param plan The scaffolding plan being built.
 */
export function planGitignoreFiles(
	state: CollectedState,
	plan: ScaffoldingPlan,
): void {
	const { cwd, options, existingFiles } = state;
	const gitignorePath = path.join(cwd, ".gitignore");
	const hasGitignore = existingFiles.includes(gitignorePath);

	if (hasGitignore && options.gitignoreContent !== undefined) {
		const lines = options.gitignoreContent.split(/\r?\n/);
		const hasEnv = isIgnored(lines, ".env");
		const hasEnvLocal = isIgnored(lines, ".env.local");

		if (!hasEnv || !hasEnvLocal) {
			let suffix = "\n# Environment variables\n";
			if (!hasEnv) suffix += ".env\n";
			if (!hasEnvLocal) suffix += ".env.local\n";

			const newContent = options.gitignoreContent.endsWith("\n")
				? `${options.gitignoreContent}${suffix.trim()}\n`
				: `${options.gitignoreContent}\n${suffix.trim()}\n`;
			plan.files.push({
				path: gitignorePath,
				content: newContent,
				action: "overwrite",
				label: ".gitignore update",
			});
		}
	} else if (!hasGitignore) {
		plan.files.push({
			path: gitignorePath,
			content: "# Environment variables\n.env\n.env.local\n",
			action: "create",
			label: ".gitignore file",
		});
	}
}

function createBaseMetadata(
	state: CollectedState,
): ScaffoldingPlan["metadata"] {
	const { mode, options, packageManager } = state;
	const projectName =
		options.name && options.name !== "."
			? path.basename(options.name)
			: undefined;

	return shake({
		displayPath: "",
		framework: options.framework,
		validator: options.validator,
		packageManager,
		importPath: "",
		mode,
		example: options.example,
		name: projectName,
		layout: options.layout,
		skillDetected: options.skillDetected,
		disableCodegen: options.disableCodegen,
	}) as ScaffoldingPlan["metadata"];
}

function planSkillInstall(state: CollectedState, plan: ScaffoldingPlan): void {
	if (!state.options.installSkill) {
		return;
	}

	plan.skill = {
		dlxCommand: getDlxCommand(state.packageManager),
		packageName: "yamcodes/arkenv",
		isYes: state.isYes,
	};
}

/**
 * Build a scaffolding plan for a new project cloned from an example.
 *
 * @param state Collected workspace state.
 * @returns The new-project scaffolding plan.
 */
export function createNewProjectPlan(state: CollectedState): ScaffoldingPlan {
	const { options, packageManager, cwd } = state;

	if (!options.example) {
		throw new Error("New project scaffolding requires an example.");
	}

	const targetDir =
		options.name && options.name !== "."
			? path.join(cwd, options.name)
			: undefined;
	const targetName =
		options.name && options.name !== "."
			? path.basename(options.name)
			: path.basename(cwd);

	const plan: ScaffoldingPlan = {
		files: [],
		cwd,
		metadata: createBaseMetadata(state),
		clone: {
			repository: "https://github.com/yamcodes/arkenv.git",
			example: options.example,
			targetName,
			...(targetDir !== undefined && { targetDir }),
		},
		install: {
			packageManager,
			dependencies: [],
			...(targetDir !== undefined && { cwd: targetDir }),
		},
	};

	planSkillInstall(state, plan);

	const envContent = formatEnvContent(
		getEnvDefaultsForExample(options.example, options.framework),
	);
	const targetDirResolved = targetDir ?? cwd;

	plan.files.push(
		{
			path: path.join(targetDirResolved, ".env"),
			content: envContent,
			action: "create",
			label: "local environment variables",
		},
		{
			path: path.join(targetDirResolved, ".env.example"),
			content: envContent,
			action: "create",
			label: "environment variables template",
		},
	);

	plan.metadata.displayPath = "./src/env.ts";
	plan.metadata.importPath = "./src/env";

	return plan;
}

/**
 * Build a scaffolding plan for an existing project.
 *
 * @param state Collected workspace state.
 * @returns The existing-project scaffolding plan.
 */
export function createExistingProjectPlan(
	state: CollectedState,
): ScaffoldingPlan {
	const {
		options,
		packageManager,
		tsConfig,
		shouldUpdateTsConfig,
		cwd,
		existingFiles,
	} = state;

	const frameworkStrategy = FRAMEWORKS[options.framework];
	const validatorStrategy = VALIDATORS[options.validator];
	const targetPath = path.resolve(cwd, options.path);
	const targetDir = path.dirname(targetPath);

	const plan: ScaffoldingPlan = {
		files: [],
		cwd,
		metadata: createBaseMetadata(state),
	};

	const fileParams = {
		targetPath,
		targetDir,
		cwd,
		existingFiles,
		overwriteEnvSchemaFile: options.overwriteEnvSchemaFile,
		installTypeDefinitions: options.installTypeDefinitions,
		envDtsHandling: options.envDtsHandling,
		path: options.path,
		tsConfig,
	};

	plan.files.push(
		...frameworkStrategy.getSchemaFiles(validatorStrategy, options, fileParams),
	);

	planEnvFiles(state, plan);
	planGitignoreFiles(state, plan);

	const deps = [
		"arkenv",
		options.validator,
		...frameworkStrategy.getDependencies(options),
	];
	if (
		frameworkStrategy.requiresArktypePeer(options) &&
		!deps.includes("arktype")
	) {
		deps.push("arktype");
	}

	plan.install = { packageManager, dependencies: deps };

	if (shouldUpdateTsConfig && tsConfig.file) {
		plan.tsConfig = {
			path: path.resolve(cwd, tsConfig.file),
			action: "strict",
		};
	}

	plan.files.push(
		...frameworkStrategy.getTypeDefinitionFiles(options, fileParams),
	);

	const bootstrap = frameworkStrategy.bootstrap(options);
	if (bootstrap) {
		plan.bootstrap = bootstrap;
	}

	planSkillInstall(state, plan);

	const relPath = path.relative(cwd, targetPath).replace(/\\/g, "/");
	const displayPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
	const importPath = displayPath.replace(/\.(ts|js|tsx|jsx)$/, "");

	plan.metadata.displayPath = displayPath;
	plan.metadata.importPath = importPath;
	if (plan.bootstrap) {
		plan.bootstrap.importPath = importPath;
	}

	return plan;
}
