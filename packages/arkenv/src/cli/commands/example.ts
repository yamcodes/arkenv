import path from "node:path";
import { mergeEnvExample } from "@/features/example/merge-env-example";
import { resolveSchemaPath } from "@/features/schema-loader";
import {
	type LoggerPort,
	type ProjectScannerPort,
	SCHEMA_LOAD_ERROR_CODES,
	type SchemaLoaderPort,
	type WorkspacePort,
} from "@/shared/ports";
import {
	type NextAction,
	PROTOCOL_ERROR_CODES,
	sanitizeSecretText,
} from "@/shared/protocol";

const EXAMPLE_FILE = ".env.example";
const DOCS_URL = "https://arkenv.js.org/docs/reference/example";

/**
 * Input parameters for the `example` command.
 */
export type ExampleInput = {
	schema?: string;
	file?: string;
	isQuiet?: boolean;
	isJson?: boolean;
	isAgent?: boolean;
	cwd?: string;
	/**
	 * Skip JSON envelopes so a parent command (init) can own stdout.
	 * Load failures still return a non-zero code without writing files.
	 */
	embedded?: boolean;
};

/**
 * Use case for updating `.env.example` from the project schema.
 */
export class ExampleUseCase {
	/**
	 * Create an ExampleUseCase with the ports used to locate, load, and write files.
	 *
	 * @param logger Port for console logging and structured reporting
	 * @param workspace Port for reading and writing workspace files
	 * @param scanner Port for scanning project configuration and detecting schema paths
	 * @param schemaLoader Port for importing and capturing schemas
	 */
	constructor(
		private readonly logger: LoggerPort,
		private readonly workspace: WorkspacePort,
		private readonly scanner: ProjectScannerPort,
		private readonly schemaLoader: SchemaLoaderPort,
	) {}

	/**
	 * Write `.env.example` from declared schema keys.
	 *
	 * @param input Options and overrides for the example command
	 * @returns Process exit code (0 for success, 2 when the schema cannot be loaded)
	 */
	async execute(input: ExampleInput): Promise<number> {
		const cwd = input.cwd ?? process.cwd();
		const requestedSchema = input.schema ?? input.file;
		const isJson = Boolean(
			!input.embedded && (this.logger.isJson || input.isJson || input.isAgent),
		);

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
			this.reportLoadFailure(isJson, input.embedded, summary, nextActions);
			return 2;
		}

		const relSchemaPath = path.relative(cwd, schemaPath) || schemaPath;
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

			const nextActions: NextAction[] =
				loadResult.code === SCHEMA_LOAD_ERROR_CODES.ERR_INSPECT_NO_CALL
					? [
							{
								kind: "run-command",
								label: "Initialize a new ArkEnv schema",
								command: "{bin} init",
							},
						]
					: [
							{
								kind: "edit-file",
								label: `Fix errors in ${relSchemaPath}`,
								where: { path: relSchemaPath },
							},
						];

			this.reportLoadFailure(
				isJson,
				input.embedded,
				summary,
				nextActions,
				relSchemaPath,
				whyText,
			);
			return 2;
		}

		const examplePath = path.join(cwd, EXAMPLE_FILE);
		const existed = await this.workspace.exists(examplePath);
		const existing = existed
			? await this.workspace.readFile(examplePath)
			: null;
		const keys = loadResult.keys.map((key) => key.name);
		const merged = mergeEnvExample(existing, keys);

		if (merged.status !== "unchanged") {
			await this.workspace.writeFile(examplePath, merged.content);
		}

		if (input.embedded) {
			return 0;
		}

		const status = existed ? merged.status : "created";
		if (isJson) {
			this.logger.reportCompleted({
				ok: true,
				commandId: "example",
				result: {
					status,
					schema: { path: relSchemaPath },
					file: { path: EXAMPLE_FILE },
					keys: {
						declared: keys.length,
					},
				},
				exitCode: 0,
				diagnostics: [],
				nextActions: [],
			});
			return 0;
		}

		if (status === "created") {
			this.logger.success(`Created ${EXAMPLE_FILE} from ${relSchemaPath}`);
		} else if (status === "updated") {
			this.logger.success(`Updated ${EXAMPLE_FILE} from ${relSchemaPath}`);
		} else {
			this.logger.success(`${EXAMPLE_FILE} already matches the schema`);
		}
		return 0;
	}

	/**
	 * Report a schema load or discovery failure without writing `.env.example`.
	 *
	 * @param isJson Whether to emit a JSON error envelope
	 * @param embedded Whether a parent command owns stdout
	 * @param summary Human-readable failure summary
	 * @param nextActions Remediation steps for JSON consumers
	 * @param schemaPath Optional relative schema path for `where`
	 * @param why Optional extra diagnostic text
	 */
	private reportLoadFailure(
		isJson: boolean,
		embedded: boolean | undefined,
		summary: string,
		nextActions: NextAction[],
		schemaPath?: string,
		why?: string,
	): void {
		if (embedded) {
			this.logger.warn(summary);
			if (why) {
				this.logger.warn(why);
			}
			return;
		}

		if (isJson) {
			this.logger.reportErrored({
				ok: false,
				commandId: "example",
				error: {
					code: PROTOCOL_ERROR_CODES.CLI_SCHEMA_NOT_FOUND,
					severity: "error",
					summary,
					docsUrl: DOCS_URL,
					...(why ? { why } : {}),
					...(schemaPath ? { where: { path: schemaPath } } : {}),
					nextActions,
				},
				diagnostics: [],
				nextActions,
			});
			return;
		}

		this.logger.error(summary);
		if (why) {
			this.logger.warn(why);
		}
	}
}
