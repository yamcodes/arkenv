import path from "node:path";
import {
	type EnvIssue,
	formatIssues,
	indent,
	isDebugSecrets,
	safeStringify,
	shouldRedact,
} from "@repo/utils";
import { parseDotenv } from "@/features/check/dotenv";
import { resolveSchemaPath } from "@/features/schema-loader";
import {
	type LoggerPort,
	type ProjectScannerPort,
	SCHEMA_LOAD_ERROR_CODES,
	type SchemaLoaderPort,
	type WorkspacePort,
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
	verifyExample?: boolean | string;
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
	/**
	 * Create a CheckUseCase with the ports used to locate, load, and
	 * validate the project schema.
	 *
	 * @param logger Port for console logging and structured reporting
	 * @param workspace Port for reading files and checking filesystem existence
	 * @param scanner Port for scanning project configuration and detecting schema paths
	 * @param schemaLoader Port for importing, capturing, and validating schemas
	 */
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly scanner: ProjectScannerPort,
		private readonly schemaLoader: SchemaLoaderPort,
	) {}

	/**
	 * Execute environment variable validation against the project schema.
	 *
	 * @param input Options and overrides for the check command
	 * @returns Process exit code (0 for valid, 4 for validation issues, 2 for missing schema/preconditions, 1 for internal crash)
	 */
	async execute(input: CheckInput): Promise<number> {
		const cwd = input.cwd ?? process.cwd();
		const requestedSchema = input.schema ?? input.file;
		const isJson = Boolean(this.logger.isJson || input.isJson || input.isAgent);

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
		const schemaPath = await resolveSchemaPath(
			cwd,
			this.workspace,
			this.scanner,
			requestedSchema,
		);
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

			if (isJson) {
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

		// 3. Load schema under capture mode to verify validity
		const loadResult = await this.schemaLoader.load({ schemaPath });
		if (!loadResult.ok) {
			const summary = sanitizeSecretText(loadResult.message);
			if (loadResult.code === SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_NO_CALL) {
				const nextActions: NextAction[] = [
					{
						kind: "run-command",
						label: "Initialize a new ArkEnv schema",
						command: "{bin} init",
					},
				];

				if (isJson) {
					this.logger.reportErrored({
						ok: false,
						commandId: "check",
						error: {
							code: PROTOCOL_ERROR_CODES.CLI_SCHEMA_NOT_FOUND,
							severity: "error",
							summary,
							where: { path: relSchemaPath },
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

			if (isJson) {
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

		// 4. Verify .env.example if --verify-example flag is present
		if (input.verifyExample !== undefined) {
			const exampleFile =
				typeof input.verifyExample === "string"
					? input.verifyExample
					: ".env.example";
			const resolvedExamplePath = path.resolve(cwd, exampleFile);
			const relExamplePath =
				path.relative(cwd, resolvedExamplePath) || exampleFile;

			let exampleContent = "";
			if (await this.workspace.exists(resolvedExamplePath)) {
				exampleContent = await this.workspace.readFile(resolvedExamplePath);
			}

			const parsedExample = parseDotenv(exampleContent);
			const declaredKeys = loadResult.keys.map((k) => k.name);
			const missingKeys = declaredKeys.filter((k) => !(k in parsedExample));

			if (missingKeys.length > 0) {
				const diagnostics: Diagnostic[] = missingKeys.map((key) => {
					const summary = `${key} is declared in schema but missing in ${relExamplePath}`;
					const nextActions: NextAction[] = [
						{
							kind: "edit-file",
							label: `Add ${key} to ${relExamplePath}`,
							where: { path: relExamplePath },
							meta: {
								targetFile: relExamplePath,
								key,
							},
						},
					];
					return {
						code: PROTOCOL_ERROR_CODES.ENV_MISSING_VARIABLE,
						severity: "error",
						summary,
						where: { path: relExamplePath },
						meta: { key, targetFile: relExamplePath },
						nextActions,
					};
				});

				const allNextActions = diagnostics.flatMap((d) => d.nextActions);

				if (isJson) {
					this.logger.reportCompleted({
						ok: true,
						commandId: "check",
						result: {
							schema: { path: relSchemaPath },
							file: { path: relExamplePath },
							keys: {
								declared: declaredKeys.length,
								missing: missingKeys.length,
							},
						},
						exitCode: 4,
						diagnostics,
						nextActions: allNextActions,
					});
				} else {
					const keyPlural = missingKeys.length === 1 ? "key" : "keys";
					const missingList = missingKeys.map((k) => `  - ${k}`).join("\n");
					this.logger.error(
						`Missing ${missingKeys.length} ${keyPlural} in ${relExamplePath}:\n${missingList}\n\nPlease add the missing ${keyPlural} to ${relExamplePath}.`,
					);
				}
				return 4;
			}

			if (isJson) {
				this.logger.reportCompleted({
					ok: true,
					commandId: "check",
					result: {
						schema: { path: relSchemaPath },
						file: { path: relExamplePath },
						keys: {
							declared: declaredKeys.length,
							missing: 0,
						},
					},
					exitCode: 0,
					diagnostics: [],
					nextActions: [],
				});
			} else {
				this.logger.success(
					`No issues found — ${relExamplePath} matches the schema`,
				);
			}
			return 0;
		}

		// 5. Resolve environment variables
		const resolvedEnv: Record<string, string | undefined> = {
			...process.env,
		};

		if (input.envFiles && input.envFiles.length > 0) {
			for (const envFile of input.envFiles) {
				const resolvedEnvPath = path.resolve(cwd, envFile);
				if (!(await this.workspace.exists(resolvedEnvPath))) {
					const summary = `Environment file not found at "${resolvedEnvPath}".`;
					if (isJson) {
						this.logger.reportErrored({
							ok: false,
							commandId: "check",
							error: {
								code: PROTOCOL_ERROR_CODES.CLI_INVALID_ARGUMENT,
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

		// 5. Validate resolved environment against schema
		const validationResult = await this.schemaLoader.validate(
			{ schemaPath },
			resolvedEnv,
		);

		if (validationResult.ok) {
			if (isJson) {
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
				this.logger.success(
					"No issues found — your environment matches the schema",
				);
			}
			return 0;
		}

		if (validationResult.kind === "validation") {
			const issues: EnvIssue[] = validationResult.issues ?? [];

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
					...(issue.expected !== undefined ? { expected: issue.expected } : {}),
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

			if (isJson) {
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
					`Errors found while validating environment variables:\n${indent(formatIssues(issues))}`,
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
			if (isJson) {
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

		if (isJson) {
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
			this.logger.error(
				`Failed to load schema file at ${relSchemaPath}: ${summary}`,
			);
		}
		return 2;
	}
}
