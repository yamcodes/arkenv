import path from "node:path";
import { shake } from "radashi";
import { getEnvTemplate, getStrictEnvTemplates } from "./env-template";
import type { CollectedState, ScaffoldingPlan } from "./plan";
import { getDlxCommand } from "./scaffold";
import { bunTypesTemplate, viteTypesTemplate } from "./templates";

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

function getEnvDefaultsFromKeys(
	keys?: string[],
	framework?: string,
): Record<string, string> {
	const defaults: Record<string, string> = {};
	if (keys && keys.length > 0) {
		for (const key of keys) {
			if (key === "NODE_ENV") {
				defaults[key] = "development";
			} else if (key === "PORT") {
				defaults[key] = "3000";
			} else if (key === "DATABASE_URL") {
				defaults[key] = "postgres://localhost:5432/mydb";
			} else {
				defaults[key] = "";
			}
		}
		return defaults;
	}

	if (framework === "nextjs") {
		return {
			DATABASE_URL: "postgres://localhost:5432/mydb",
			NEXT_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	}
	if (framework === "nuxt") {
		return {
			DATABASE_URL: "postgres://localhost:5432/mydb",
			NUXT_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	}
	if (framework === "vite") {
		return {
			PORT: "3000",
			VITE_API_URL: "https://api.example.com",
		};
	}
	if (framework === "bun-fullstack") {
		return {
			BUN_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "development",
		};
	}
	return {
		PORT: "3000",
		NODE_ENV: "development",
	};
}

function getEnvDefaultsForExample(
	example: string,
	framework?: string,
): Record<string, string> {
	if (exampleEnvDefaults[example]) {
		return exampleEnvDefaults[example];
	}
	return getEnvDefaultsFromKeys(undefined, framework);
}

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
			disableCodegen: options.disableCodegen,
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

		const targetDirResolved = targetDir ?? cwd;
		const envPath = path.join(targetDirResolved, ".env");
		const envExamplePath = path.join(targetDirResolved, ".env.example");

		const defaults = getEnvDefaultsForExample(
			options.example,
			options.framework,
		);
		const envContent =
			Object.entries(defaults)
				.map(([k, v]) => `${k}=${v}`)
				.join("\n") + "\n";

		plan.files.push({
			path: envPath,
			content: envContent,
			action: "create",
			label: "local environment variables",
		});

		plan.files.push({
			path: envExamplePath,
			content: envContent,
			action: "create",
			label: "environment variables template",
		});

		// Examples usually have the schema at src/env.ts
		plan.metadata.displayPath = "./src/env.ts";
		plan.metadata.importPath = "./src/env";

		return plan;
	}

	// mode === "existing"
	const targetPath = path.resolve(cwd, options.path);
	const targetDir = path.dirname(targetPath);

	// 1. Env Schema File(s)
	if (
		(options.framework === "nextjs" || options.framework === "nuxt") &&
		options.layout === "strict"
	) {
		const ext = path.extname(targetPath);
		const baseWithoutExt = targetPath.slice(0, -ext.length);
		const sharedPath = path.join(baseWithoutExt, "internal", `shared${ext}`);
		const clientPath = path.join(baseWithoutExt, `client${ext}`);
		const serverPath = path.join(baseWithoutExt, `server${ext}`);

		let nextjsImportPath: string | undefined;
		if (
			(options.framework === "nextjs" || options.framework === "nuxt") &&
			!options.disableCodegen &&
			tsConfig?.parsed
		) {
			const parsed = tsConfig.parsed;
			const compilerOptions = parsed.compilerOptions || {};
			const paths = compilerOptions.paths || {};
			if (paths["@/*"]) {
				const tsConfigDir = parsed.path ? path.dirname(parsed.path) : cwd;
				const generatedDir = path.join(baseWithoutExt, "generated");
				const relGeneratedDir = path
					.relative(tsConfigDir, generatedDir)
					.replace(/\\/g, "/");

				for (const pattern of paths["@/*"]) {
					const normalizedPattern = pattern
						.replace(/^\.\//, "")
						.replace(/\*$/, "");
					if (
						normalizedPattern === "" ||
						relGeneratedDir.startsWith(normalizedPattern)
					) {
						let subPath = relGeneratedDir;
						if (
							normalizedPattern !== "" &&
							relGeneratedDir.startsWith(normalizedPattern)
						) {
							subPath = relGeneratedDir.substring(normalizedPattern.length);
						}
						subPath = subPath.replace(/^\/+/, "").replace(/\/+$/, "");
						nextjsImportPath = `@/${subPath}/env.gen`.replace(/\/+/g, "/");
						break;
					}
				}
			}
		}

		const templates = getStrictEnvTemplates(options, nextjsImportPath);

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
		let nextjsImportPath: string | undefined;
		if (
			(options.framework === "nextjs" || options.framework === "nuxt") &&
			!options.disableCodegen &&
			tsConfig?.parsed
		) {
			const parsed = tsConfig.parsed;
			const compilerOptions = parsed.compilerOptions || {};
			const paths = compilerOptions.paths || {};
			if (paths["@/*"]) {
				const tsConfigDir = parsed.path ? path.dirname(parsed.path) : cwd;
				const generatedDir = path.join(targetDir, "generated");
				const relGeneratedDir = path
					.relative(tsConfigDir, generatedDir)
					.replace(/\\/g, "/");

				for (const pattern of paths["@/*"]) {
					const normalizedPattern = pattern
						.replace(/^\.\//, "")
						.replace(/\*$/, "");
					if (
						normalizedPattern === "" ||
						relGeneratedDir.startsWith(normalizedPattern)
					) {
						let subPath = relGeneratedDir;
						if (
							normalizedPattern !== "" &&
							relGeneratedDir.startsWith(normalizedPattern)
						) {
							subPath = relGeneratedDir.substring(normalizedPattern.length);
						}
						subPath = subPath.replace(/^\/+/, "").replace(/\/+$/, "");
						nextjsImportPath = `@/${subPath}/env.gen`.replace(/\/+/g, "/");
						break;
					}
				}
			}
		}

		const envContent = getEnvTemplate(options, nextjsImportPath);
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

	// 1b. Env / Env.example Files
	const envPath = path.join(cwd, ".env");
	const envExamplePath = path.join(cwd, ".env.example");

	const hasEnv = existingFiles.includes(envPath);
	const hasEnvExample = existingFiles.includes(envExamplePath);

	if (!hasEnv) {
		const content =
			options.envExampleContent !== undefined
				? options.envExampleContent
				: (() => {
						const defaults = getEnvDefaultsFromKeys(
							options.envKeys,
							options.framework,
						);
						return (
							Object.entries(defaults)
								.map(([k, v]) => `${k}=${v}`)
								.join("\n") + "\n"
						);
					})();
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
				: (() => {
						const defaults = getEnvDefaultsFromKeys(
							options.envKeys,
							options.framework,
						);
						return (
							Object.entries(defaults)
								.map(([k, v]) => `${k}=${v}`)
								.join("\n") + "\n"
						);
					})();
		plan.files.push({
			path: envExamplePath,
			content,
			action: "create",
			label: "environment variables template",
		});
	}

	// 1c. Gitignore check (only for existing projects to avoid overwriting template gitignores)
	if (mode === "existing") {
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

	// 2. dependencies
	const deps = ["arkenv", options.validator];
	if (options.framework === "vite") deps.push("@arkenv/vite-plugin");
	if (options.framework === "bun-fullstack" && options.bunFeatures?.length) {
		deps.push("@arkenv/bun-plugin");
	}
	if (options.framework === "nextjs") {
		deps.push("@arkenv/nextjs");
	}
	if (options.framework === "nuxt") {
		deps.push("@arkenv/nuxt");
	}

	// Framework integrations require arktype as a peer dependency.
	// Ensure arktype is installed when using a framework integration.
	if (
		(options.framework === "vite" ||
			options.framework === "nextjs" ||
			options.framework === "nuxt" ||
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
	if (
		options.framework === "vite" ||
		options.framework === "bun-fullstack" ||
		options.framework === "nextjs" ||
		options.framework === "nuxt"
	) {
		plan.bootstrap = shake({
			framework: options.framework,
			bunFeatures:
				options.framework === "bun-fullstack" ? options.bunFeatures : undefined,
			wrapNextjsConfig:
				options.framework === "nextjs"
					? options.wrapNextjsConfig !== false
					: undefined,
			disableCodegen: options.disableCodegen,
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
