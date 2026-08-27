import path from "node:path";
import { parseDotenv } from "@/features/check/dotenv";
import type {
	LoggerPort,
	ProjectScannerPort,
	SchemaLoaderPort,
	WorkspacePort,
} from "@/shared/ports";

/**
 * Input parameters for the `check` CLI command.
 */
export type CheckInput = {
	/**
	 * Explicit path to the schema module (overrides package.json or convention discovery).
	 */
	schema?: string | undefined;
	/**
	 * List of `.env` file paths to load in sequence (later files overwrite earlier ones).
	 */
	envFiles?: string[] | undefined;
	/**
	 * Suppress console output.
	 */
	isQuiet?: boolean | undefined;
	/**
	 * Emit machine-readable JSON output.
	 */
	isJson?: boolean | undefined;
	/**
	 * Run in agent mode (implies `--quiet`, `--json`, `--yes`).
	 */
	isAgent?: boolean | undefined;
	/**
	 * Working directory to resolve paths from (defaults to `process.cwd()`).
	 */
	cwd?: string | undefined;
};

/**
 * Use case for validating environment variables against a project's schema.
 */
export class CheckUseCase {
	/**
	 * Creates a new CheckUseCase instance.
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
	 * @param input Configuration options and overrides for the check command
	 * @returns `true` if the environment is valid; `false` otherwise
	 */
	async execute(input: CheckInput): Promise<boolean> {
		const cwd = input.cwd ?? process.cwd();
		const isJson = Boolean(input.isJson || input.isAgent);

		// 1. Locate schema file
		const schemaPath = await this.resolveSchemaPath(cwd, input.schema);
		if (!schemaPath) {
			const message = input.schema
				? `Schema file not found at "${path.resolve(cwd, input.schema)}".`
				: "Could not locate your schema file. Add an 'arkenv' entry to package.json or specify --schema <path>.";
			this.logger.error(message);
			if (isJson) {
				this.logger.json({
					status: "error",
					code: "SCHEMA_NOT_FOUND",
					message,
				});
			}
			return false;
		}

		// 2. Resolve environment variables
		const resolvedEnv: Record<string, string | undefined> = {
			...process.env,
		};

		if (input.envFiles && input.envFiles.length > 0) {
			for (const envFile of input.envFiles) {
				const resolvedEnvPath = path.resolve(cwd, envFile);
				if (!(await this.workspace.exists(resolvedEnvPath))) {
					const message = `Environment file not found at "${resolvedEnvPath}".`;
					this.logger.error(message);
					if (isJson) {
						this.logger.json({
							status: "error",
							code: "ENV_FILE_NOT_FOUND",
							message,
						});
					}
					return false;
				}

				const content = await this.workspace.readFile(resolvedEnvPath);
				const parsed = parseDotenv(content);
				Object.assign(resolvedEnv, parsed);
			}
		}

		// 3. Inspect schema under capture mode to verify validity and extract keys
		const loadResult = await this.schemaLoader.load({ schemaPath });
		if (!loadResult.ok) {
			this.logger.error(loadResult.message);
			if (isJson) {
				this.logger.json({
					status: "error",
					code: loadResult.code,
					message: loadResult.message,
				});
			}
			return false;
		}

		// 4. Validate resolved environment against schema
		const validationResult = await this.schemaLoader.validate(
			{ schemaPath },
			resolvedEnv,
		);

		if (!validationResult.ok) {
			if (validationResult.kind === "validation") {
				if (isJson) {
					this.logger.json({
						status: "error",
						code: "VALIDATION_FAILED",
						message: "Errors found while validating environment variables",
						issues: validationResult.issues,
					});
				} else {
					this.logger.log(validationResult.message.trimEnd());
				}
				return false;
			}

			// kind === "load"
			this.logger.error(validationResult.message);
			if (isJson) {
				this.logger.json({
					status: "error",
					code: validationResult.code,
					message: validationResult.message,
				});
			}
			return false;
		}

		// 5. Report success
		const successMessage =
			"No issues found — your environment matches the schema";
		if (isJson) {
			this.logger.json({
				status: "success",
				message: successMessage,
				details: {
					keys: loadResult.keys.map((k) => k.name),
				},
			});
		} else {
			this.logger.success(successMessage);
		}

		return true;
	}

	/**
	 * Find the absolute path to the project's schema file.
	 *
	 * @param cwd Current working directory
	 * @param schemaOverride Optional explicit schema file path passed via CLI
	 * @returns Absolute path to existing schema file, or `null` if not found
	 */
	private async resolveSchemaPath(
		cwd: string,
		schemaOverride?: string,
	): Promise<string | null> {
		if (schemaOverride) {
			const resolved = path.resolve(cwd, schemaOverride);
			return (await this.workspace.exists(resolved)) ? resolved : null;
		}

		// Check package.json arkenv config
		if (typeof this.scanner.readArkenvConfig === "function") {
			const arkenvConfig = await this.scanner.readArkenvConfig(cwd);
			if (arkenvConfig) {
				const resolved = path.resolve(cwd, arkenvConfig.schema);
				if (await this.workspace.exists(resolved)) {
					return resolved;
				}
			}
		}

		// Fallback to convention locations
		const candidates = [
			path.resolve(cwd, "env.ts"),
			path.resolve(cwd, "src/env.ts"),
		];

		const suggested = await this.scanner.suggestDefaultEnvPath(cwd);
		if (suggested) {
			candidates.unshift(path.resolve(cwd, suggested));
		}

		for (const candidate of candidates) {
			if (await this.workspace.exists(candidate)) {
				return candidate;
			}
		}

		return null;
	}
}
