import path from "node:path";
import { shake } from "radashi";
import { getEnvTemplate } from "./env-template";
import type { CollectedState, ScaffoldingPlan } from "./plan";
import { getDlxCommand } from "./scaffold";
import { bunTypesTemplate, viteTypesTemplate } from "./templates";

/**
 * Create a ScaffoldingPlan based on the collected workspace state.
 *
 * @param state The collected state of the workspace.
 * @returns The resulting scaffolding plan.
 */
export function createPlan(state: CollectedState): ScaffoldingPlan {
	const {
		options,
		packageManager,
		tsConfig,
		shouldUpdateTsConfig,
		cwd,
		existingFiles,
	} = state;
	const targetPath = path.resolve(cwd, options.path);
	const targetDir = path.dirname(targetPath);

	const plan: ScaffoldingPlan = {
		files: [],
		metadata: {
			displayPath: "",
			framework: options.framework,
			validator: options.validator,
			packageManager,
			importPath: "",
		},
	};

	// 1. Env Schema File
	const envContent = getEnvTemplate(options);
	const envFileExists = existingFiles.includes(targetPath);

	if (!envFileExists || options.overwriteEnvSchemaFile !== false) {
		plan.files.push({
			path: targetPath,
			content: envContent,
			action: envFileExists ? "overwrite" : "create",
			label: "environment schema",
		});
	}

	// 2. dependencies
	const deps = ["arkenv", options.validator];
	if (options.framework === "vite") deps.push("@arkenv/vite-plugin");
	if (options.framework === "bun-fullstack" && options.bunFeatures?.length) {
		deps.push("@arkenv/bun-plugin");
	}

	plan.install = {
		packageManager,
		dependencies: deps,
	};

	// 3. TS Config
	if (shouldUpdateTsConfig && tsConfig.file) {
		plan.tsConfig = {
			path: path.resolve(cwd, tsConfig.file),
			action: "strict",
		};
	}

	// 4. Type Definitions
	if (
		(options.framework === "vite" ||
			(options.framework === "bun-fullstack" && options.bunFeatures?.length)) &&
		options.installTypeDefinitions !== false
	) {
		const typeFileName =
			options.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
		const typeFilePath = path.join(targetDir, typeFileName);
		const typeFileExists = existingFiles.includes(typeFilePath);

		if (options.envDtsHandling !== "skip") {
			if (
				options.envDtsHandling === "append" ||
				(!options.envDtsHandling && typeFileExists)
			) {
				plan.files.push({
					path: typeFilePath,
					content: targetPath, // We pass the schema path to append logic
					action: "append",
					label: `${options.framework} types`,
				});
			} else {
				const content =
					options.framework === "vite"
						? viteTypesTemplate(options.path)
						: bunTypesTemplate(options.path);
				plan.files.push({
					path: typeFilePath,
					content,
					action: typeFileExists ? "overwrite" : "create",
					label: `${options.framework} types`,
				});
			}
		}
	}

	// 5. Framework-specific bootstrapping
	if (options.framework === "vite" || options.framework === "bun-fullstack") {
		plan.bootstrap = shake({
			framework: options.framework,
			bunFeatures:
				options.framework === "bun-fullstack" ? options.bunFeatures : undefined,
		});
	}

	// 6. Skill
	if (options.installSkill) {
		plan.skill = {
			dlxCommand: getDlxCommand(packageManager),
			packageName: "yamcodes/arkenv",
			isYes: state.isYes,
		};
	}

	// Metadata
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
