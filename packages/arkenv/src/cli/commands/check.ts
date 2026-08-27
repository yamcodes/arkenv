import path from "node:path";
import { parseDotenv } from "@/features/check/dotenv";
import {
	formatIssues,
	indent,
	isDebugSecrets,
	safeStringify,
	shouldRedact,
} from "@repo/utils";
import type {
	LoggerPort,
	ProjectScannerPort,
	SCHEMA_LOAD_ERROR_CODES,
	SchemaLoaderPort,
	WorkspacePort,
} from "@/shared/ports";
import {
	type Diagnostic,
	type NextAction,
	PROTOCOL_ERROR_CODES,
	sanitizeSecretText,
} from "@/shared/protocol";

/**
 * Input parameters for the 'check' command.
 */
export type CheckInput = {
	schema?: string;
	file?: string;
	envFiles?: string[];
	isQuiet?: boolean;
	isJson?: boolean;
	isAgent?: boolean;
	isYes?: boolean;
	isForce?: boolean;
	cwd?: string;
};

/**
 * Use case for validating environment variables against a project's schema.
 */
export class CheckUseCase {
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly scanner: ProjectScannerPort,
		private readonly schemaLoader: SchemaLoaderPort,
	) {}

	/**
	 * Executes environment variable validation against the project schema.
	 *
	 * @param input Options and overrides for the check command
	 * @returns Process exit code (0 for valid, 4 for validation issues, 2 for missing schema/preconditions, 1 for internal crash)
	 */
	async execute(input: CheckInput): Promise<number> {
		const cwd = input.cwd ?? process.cwd();
		const requestedSchema = input.schema ?? input.file;

		// 1. Detect framework to suggest appropriate .env file (e.g. .env.local for Next.js)
		let suggestedEnvFile = ".env";
		try {
			const framework = await this.scanner.detectFramework(cwd);
			if (framework === "nextjs") {
				suggestedEnvFile = ".env.local";
			}
		} catch {
			// Default to .env if scanner fails
		}

		// 2. Locate schema file
		const schemaPath = await this.resolveSchemaPath(cwd, requestedSchema);
		if (!schemaPath) {
			const summary = requestedSchema
				? `Schema file not found at "${path.resolve(cwd, requestedSchema)}".`
				: "Could not locate your schema file. Add an 'arkenv' entry to package.json or specify --schema <path>.";

			const nextActions: NextAction[] = [
				{
					kind: "run-command",
					label: "Initialize a new ArkEnv schema",
					command: "{bin} init",
				},
			];

			if (this.logger.isJson) {
				this.logger.reportErrored({
					ok: false,
					commandId: "check",
					error: {
						code: PROTOCOL_ERROR_CODES.CLI_SCHEMA_NOT_FOUND,
						severity: "error",
						summary,
						why: "The schema file could not be found in package.json or convention paths.",
						docsUrl: "https://arkenv.js.org/docs/reference/check",
						nextActions,
					},
					diagnostics: [],
					nextActions,
				});
			} else {
				this.logger.error(summary);
			}
			return 2;
		}

		const relSchemaPath = path.relative(cwd, schemaPath) || schemaPath;

		// 3. Resolve environment variables
		const resolvedEnv: Record<string, string | undefined> = {
			...process.env,
		};

		if (input.envFiles && input.envFiles.length > 0) {
			for (const envFile of input.envFiles) {
				const resolvedEnvPath = path.resolve(cwd, envFile);
				if (!(await this.workspace.exists(resolvedEnvPath))) {
					const summary = `Environment file not found at "${resolvedEnvPath}".`;
					if (this.logger.isJson) {
						this.logger.reportErrored({
							ok: false,
							commandId: "check",
							error: {
								code: PROTOCOL_ERROR_CODES.CLI_SCHEMA_NOT_FOUND,
								severity: "error",
								summary,
								where: { path: envFile },
								nextActions: [],
							},
							diagnostics: [],
							nextActions: [],
						});
					} else {
						this.logger.error(summary);
					}
					return 2;
				}

				const content = await this.workspace.readFile(resolvedEnvPath);
				const parsed = parseDotenv(content);
				Object.assign(resolvedEnv, parsed);
			}
		}

		// 4. Load schema under capture mode to verify validity
		const loadResult = await this.schemaLoader.load({ schemaPath });
		if (!loadResult.ok) {
			const summary = sanitizeSecretText(loadResult.message);
			const whyText = loadResult.cause
				? sanitizeSecretText(
						loadResult.cause instanceof Error
							? (loadResult.cause.stack ?? loadResult.cause.message)
							: String(loadResult.cause),
					)
				: undefined;

			const nextActions: NextAction[] = [
				{
					kind: "edit-file",
					label: `Fix errors in ${relSchemaPath}`,
					where: { path: relSchemaPath },
				},
			];

			if (this.logger.isJson) {
				this.logger.reportErrored({
					ok: false,
					commandId: "check",
					error: {
						code: PROTOCOL_ERROR_CODES.CLI_SCHEMA_NOT_FOUND,
						severity: "error",
						summary,
						...(whyText ? { why: whyText } : {}),
						where: { path: relSchemaPath },
						nextActions,
					},
					diagnostics: [],
					nextActions,
				});
			} else {
				this.logger.error(summary);
				if (whyText) {
					this.logger.warn(whyText);
				}
			}
			return 2;
		}

		// 5. Validate resolved environment against schema
		const validationResult = await this.schemaLoader.validate(
			{ schemaPath },
			resolvedEnv,
		);

		if (validationResult.ok) {
			if (this.logger.isJson) {
				this.logger.reportCompleted({
					ok: true,
					commandId: "check",
					result: {
						schema: {
							path: relSchemaPath,
						},
					},
					exitCode: 0,
					diagnostics: [],
					nextActions: [],
				});
			} else {
				this.logger.success("Environment variables are valid");
			}
			return 0;
		}

		if (validationResult.kind === "validation") {
			const issues = (validationResult.issues ?? []) as Array<{
				path: string;
				message: string;
				code: string;
				expected?: string;
				received?: unknown;
				meta?: Record<string, unknown>;
			}>;

			const diagnostics: Diagnostic[] = issues.map((issue) => {
				const isMissing =
					issue.code === "MISSING_VARIABLE" || issue.received === undefined;
				const code = isMissing
					? PROTOCOL_ERROR_CODES.ENV_MISSING_VARIABLE
					: PROTOCOL_ERROR_CODES.ENV_INVALID_VALUE;
				const isSensitive = shouldRedact(issue.path) && !isDebugSecrets();

				let received: unknown;
				if (isSensitive) {
					received = isMissing ? "missing" : "[REDACTED]";
				} else {
					received = isMissing
						? "missing"
						: issue.received !== undefined
							? typeof issue.received === "string"
								? issue.received
								: safeStringify(issue.received, issue.path)
							: "missing";
				}

				const summary = sanitizeSecretText(
					issue.message.startsWith(issue.path)
						? issue.message
						: `${issue.path} ${issue.message.trimStart()}`,
					issue.path,
				);

				const nextActions: NextAction[] = [
					{
						kind: "edit-file",
						label: `Set ${issue.path} in ${suggestedEnvFile}`,
						where: {
							path: suggestedEnvFile,
						},
						meta: {
							targetFile: suggestedEnvFile,
							key: issue.path,
							...(issue.expected !== undefined
								? { expected: issue.expected }
								: {}),
						},
					},
				];

				const meta: Record<string, unknown> = {
					key: issue.path,
					...(issue.expected !== undefined
						? { expected: issue.expected }
						: {}),
					received,
					issueCode: issue.code,
					...(issue.meta ? issue.meta : {}),
				};

				return {
					code,
					severity: "error",
					summary,
					where: {
						path: relSchemaPath,
					},
					meta,
					nextActions,
				};
			});

			const allNextActions = diagnostics.flatMap((d) => d.nextActions);

			if (this.logger.isJson) {
				this.logger.reportCompleted({
					ok: true,
					commandId: "check",
					result: {
						schema: {
							path: relSchemaPath,
						},
					},
					exitCode: 4,
					diagnostics,
					nextActions: allNextActions,
				});
			} else {
				this.logger.error(
					`Errors found while validating environment variables:\n${indent(formatIssues(issues as any))}`,
				);
			}
			return 4;
		}

		// validationResult.kind === "load"
		const message = validationResult.message;
		const summary = sanitizeSecretText(message);

		// If cause indicates an unexpected runtime crash during evaluation
		if (
			validationResult.cause &&
			!(validationResult.cause instanceof SyntaxError) &&
			!/syntax|cannot find module/i.test(message)
		) {
			if (this.logger.isJson) {
				this.logger.reportErrored({
					ok: false,
					commandId: "check",
					error: {
						code: PROTOCOL_ERROR_CODES.CLI_INTERNAL_ERROR,
						severity: "error",
						summary,
						where: { path: relSchemaPath },
						nextActions: [],
					},
					diagnostics: [],
					nextActions: [],
				});
			} else {
				this.logger.error(`Failed to validate environment: ${summary}`);
			}
			return 1;
		}

		if (this.logger.isJson) {
			this.logger.reportErrored({
				ok: false,
				commandId: "check",
				error: {
					code: PROTOCOL_ERROR_CODES.CLI_SCHEMA_NOT_FOUND,
					severity: "error",
					summary,
					where: { path: relSchemaPath },
					nextActions: [],
				},
				diagnostics: [],
				nextActions: [],
			});
		} else {
			this.logger.error(`Failed to load schema file at ${relSchemaPath}: ${summary}`);
		}
		return 2;
	}

	/**
	 * Resolves the path to the schema module.
	 */
	private async resolveSchemaPath(
		cwd: string,
		explicitPath?: string,
	): Promise<string | undefined> {
		if (explicitPath) {
			const resolved = path.resolve(cwd, explicitPath);
			return (await this.workspace.exists(resolved)) ? resolved : undefined;
		}

		const packageJsonPath = path.join(cwd, "package.json");
		if (await this.workspace.exists(packageJsonPath)) {
			try {
				const content = await this.workspace.readFile(packageJsonPath);
				const pkg = JSON.parse(content);
				if (typeof pkg.arkenv === "string") {
					const resolved = path.resolve(cwd, pkg.arkenv);
					if (await this.workspace.exists(resolved)) {
						return resolved;
					}
				}
			} catch {
				// Ignore malformed package.json
			}
		}

		const conventionPaths = [
			"src/env.ts",
			"env.ts",
			"src/env.js",
			"env.js",
			"src/env.mjs",
			"env.mjs",
		];

		for (const rel of conventionPaths) {
			const candidate = path.resolve(cwd, rel);
			if (await this.workspace.exists(candidate)) {
				return candidate;
			}
		}

		return undefined;
	}
}
