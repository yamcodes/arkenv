import path from "node:path";
import { shake } from "radashi";
import { getEnvTemplate, getStrictEnvTemplates } from "./env-template";
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
		mode,
		options,
		packageManager,
		tsConfig,
		shouldUpdateTsConfig,
		cwd,
		existingFiles,
	} = state;

	const projectName =
		options.name && options.name !== "."
			? path.basename(options.name)
			: undefined;

	const plan: ScaffoldingPlan = {
		files: [],
		cwd,
		metadata: shake({
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
		}) as ScaffoldingPlan["metadata"],
	};

	if (mode === "new") {
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

		plan.clone = {
			repository: "https://github.com/yamcodes/arkenv.git",
			example: options.example,
			targetName,
			...(targetDir !== undefined && { targetDir }),
		};

		plan.install = {
			packageManager,
			dependencies: [], // Dependencies are already in the example's package.json
			...(targetDir !== undefined && { cwd: targetDir }),
		};

		if (options.installSkill) {
			plan.skill = {
				dlxCommand: getDlxCommand(packageManager),
				packageName: "yamcodes/arkenv",
				isYes: state.isYes,
			};
		}

		// Examples usually have the schema at src/env.ts
		plan.metadata.displayPath = "./src/env.ts";
		plan.metadata.importPath = "./src/env";

		return plan;
	}

	// mode === "existing"
	const targetPath = path.resolve(cwd, options.path);
	const targetDir = path.dirname(targetPath);

	// 1. Env Schema File(s)
	if (options.framework === "nextjs" && options.layout === "strict") {
		const ext = path.extname(targetPath);
		const baseWithoutExt = targetPath.slice(0, -ext.length);
		const sharedPath = path.join(baseWithoutExt, "internal", `shared${ext}`);
		const clientPath = path.join(baseWithoutExt, `client${ext}`);
		const serverPath = path.join(baseWithoutExt, `server${ext}`);

		const templates = getStrictEnvTemplates(options);

		const sharedExists = existingFiles.includes(sharedPath);
		const clientExists = existingFiles.includes(clientPath);
		const serverExists = existingFiles.includes(serverPath);

		if (!sharedExists || options.overwriteEnvSchemaFile !== false) {
			plan.files.push({
				path: sharedPath,
				content: templates.shared,
				action: sharedExists ? "overwrite" : "create",
				label: "shared environment schema",
			});
		}
		if (!clientExists || options.overwriteEnvSchemaFile !== false) {
			plan.files.push({
				path: clientPath,
				content: templates.client,
				action: clientExists ? "overwrite" : "create",
				label: "client environment schema",
			});
		}
		if (!serverExists || options.overwriteEnvSchemaFile !== false) {
			plan.files.push({
				path: serverPath,
				content: templates.server,
				action: serverExists ? "overwrite" : "create",
				label: "server environment schema",
			});
		}
	} else {
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
	}

	// 2. dependencies
	const deps = ["arkenv", options.validator];
	if (options.framework === "vite") deps.push("@arkenv/vite-plugin");
	if (options.framework === "bun-fullstack" && options.bunFeatures?.length) {
		deps.push("@arkenv/bun-plugin");
	}
	if (options.framework === "nextjs") {
		deps.push("@arkenv/nextjs");
	}

	// Framework integrations require arktype as a peer dependency.
	// Ensure arktype is installed when using a framework integration.
	if (
		(options.framework === "vite" ||
			options.framework === "nextjs" ||
			(options.framework === "bun-fullstack" && options.bunFeatures?.length)) &&
		!deps.includes("arktype")
	) {
		deps.push("arktype");
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
