import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	LoggerPort,
	ProjectScannerPort,
	SchemaLoaderPort,
	WorkspacePort,
} from "@/shared/ports";
import { CheckUseCase } from "./check";

describe("CheckUseCase", () => {
	let logger: LoggerPort;
	let workspace: WorkspacePort;
	let scanner: ProjectScannerPort;
	let schemaLoader: SchemaLoaderPort;
	let useCase: CheckUseCase;

	beforeEach(() => {
		logger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
			step: vi.fn(),
			note: vi.fn(),
			log: vi.fn(),
			spinner: vi.fn(),
			json: vi.fn(),
			cancel: vi.fn(),
			fatal: vi.fn(() => {
				throw new Error("fatal");
			}),
			refuse: vi.fn(),
			finish: vi.fn(),
			flush: vi.fn(),
			interactiveStdout: vi.fn(),
			stdio: "inherit" as const,
		};

		workspace = {
			exists: vi.fn(async () => true),
			readFile: vi.fn(async () => ""),
			writeFile: vi.fn(async () => {}),
			mkdir: vi.fn(async () => {}),
			execute: vi.fn(async () => {}),
		} as unknown as WorkspacePort;

		scanner = {
			isEmptyDirectory: vi.fn(async () => false),
			hasPackageJson: vi.fn(async () => true),
			findTsConfig: vi.fn(async () => null),
			loadTsConfig: vi.fn(async () => ({
				path: "",
				raw: {},
				parsed: {},
				compilerOptions: {},
			})),
			getEnvExampleKeys: vi.fn(async () => null),
			suggestDefaultEnvPath: vi.fn(async () => "./src/env.ts"),
			checkTsConfig: vi.fn(async () => ({ status: "strict" as const })),
			checkRequirements: vi.fn(async () => []),
			detectFramework: vi.fn(async () => "vanilla" as const),
			detectBunFeatures: vi.fn(async () => []),
			detectPackageManager: vi.fn(async () => "npm" as const),
			hasSkill: vi.fn(async () => false),
			checkGitStatus: vi.fn(async () => ({ status: "clean" as const })),
			findPackageJson: vi.fn(async () => "/app/package.json"),
			readArkenvConfig: vi.fn(async () => null),
		};

		schemaLoader = {
			load: vi.fn(async () => ({
				ok: true as const,
				keys: [
					{ name: "DATABASE_URL", schema: undefined, hasDefault: false },
					{ name: "PORT", schema: undefined, hasDefault: true },
				],
				schema: {},
			})),
			validate: vi.fn(async () => ({ ok: true as const })),
		};

		useCase = new CheckUseCase(logger, workspace, scanner, schemaLoader);
	});

	it("returns true and logs success when environment is valid", async () => {
		const result = await useCase.execute({
			schema: "./src/env.ts",
		});

		expect(result).toBe(true);
		expect(logger.success).toHaveBeenCalledWith(
			"No issues found — your environment matches the schema",
		);
		expect(schemaLoader.validate).toHaveBeenCalledWith(
			{ schemaPath: path.resolve(process.cwd(), "./src/env.ts") },
			expect.any(Object),
		);
	});

	it("emits structured JSON on success when isJson is enabled", async () => {
		const result = await useCase.execute({
			schema: "./src/env.ts",
			isJson: true,
		});

		expect(result).toBe(true);
		expect(logger.json).toHaveBeenCalledWith({
			status: "success",
			message: "No issues found — your environment matches the schema",
			details: {
				keys: ["DATABASE_URL", "PORT"],
			},
		});
	});

	it("fails and logs error when schema file does not exist", async () => {
		vi.mocked(workspace.exists).mockResolvedValue(false);

		const result = await useCase.execute({
			schema: "./src/missing-env.ts",
		});

		expect(result).toBe(false);
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Schema file not found"),
		);
	});

	it("emits structured error when schema file is missing in JSON mode", async () => {
		vi.mocked(workspace.exists).mockResolvedValue(false);

		const result = await useCase.execute({
			schema: "./src/missing-env.ts",
			isJson: true,
		});

		expect(result).toBe(false);
		expect(logger.json).toHaveBeenCalledWith({
			status: "error",
			code: "SCHEMA_NOT_FOUND",
			message: expect.stringContaining("Schema file not found"),
		});
	});

	it("discovers schema file from package.json arkenv config", async () => {
		vi.mocked(scanner.readArkenvConfig).mockResolvedValue({
			schema: "./custom/my-env.ts",
			layout: "flat",
		});

		const result = await useCase.execute({});

		expect(result).toBe(true);
		expect(schemaLoader.validate).toHaveBeenCalledWith(
			{ schemaPath: path.resolve(process.cwd(), "./custom/my-env.ts") },
			expect.any(Object),
		);
	});

	it("fails when an explicitly provided --env-file does not exist", async () => {
		vi.mocked(workspace.exists).mockImplementation(async (p) => {
			return !p.endsWith(".env.local");
		});

		const result = await useCase.execute({
			schema: "./src/env.ts",
			envFiles: [".env.local"],
		});

		expect(result).toBe(false);
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Environment file not found"),
		);
	});

	it("emits ENV_FILE_NOT_FOUND error in JSON mode when --env-file is missing", async () => {
		vi.mocked(workspace.exists).mockImplementation(async (p) => {
			return !p.endsWith(".env.local");
		});

		const result = await useCase.execute({
			schema: "./src/env.ts",
			envFiles: [".env.local"],
			isJson: true,
		});

		expect(result).toBe(false);
		expect(logger.json).toHaveBeenCalledWith({
			status: "error",
			code: "ENV_FILE_NOT_FOUND",
			message: expect.stringContaining("Environment file not found"),
		});
	});

	it("loads and merges multiple --env-file flags in sequence", async () => {
		vi.mocked(workspace.readFile).mockImplementation(async (filePath) => {
			if (filePath.endsWith(".env.base")) {
				return "PORT=3000\nHOST=localhost\nDEBUG=false";
			}
			if (filePath.endsWith(".env.override")) {
				return "PORT=8080\nDEBUG=true";
			}
			return "";
		});

		const result = await useCase.execute({
			schema: "./src/env.ts",
			envFiles: [".env.base", ".env.override"],
		});

		expect(result).toBe(true);
		expect(schemaLoader.validate).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({
				PORT: "8080",
				HOST: "localhost",
				DEBUG: "true",
			}),
		);
	});

	it("fails when schemaLoader.load fails under capture mode", async () => {
		vi.mocked(schemaLoader.load).mockResolvedValue({
			ok: false,
			code: "NO_SCHEMA",
			message: "No arkenv() schema found",
		});

		const result = await useCase.execute({
			schema: "./src/env.ts",
		});

		expect(result).toBe(false);
		expect(logger.error).toHaveBeenCalledWith("No arkenv() schema found");
		expect(schemaLoader.validate).not.toHaveBeenCalled();
	});

	it("fails and logs formatted error when validation fails", async () => {
		vi.mocked(schemaLoader.validate).mockResolvedValue({
			ok: false,
			kind: "validation",
			message:
				"Errors found while validating environment variables\n  PORT must be a number",
			issues: [
				{
					path: "PORT",
					message: "must be a number",
					code: "INVALID_TYPE",
				},
			],
		});

		const result = await useCase.execute({
			schema: "./src/env.ts",
		});

		expect(result).toBe(false);
		expect(logger.log).toHaveBeenCalledWith(
			"Errors found while validating environment variables\n  PORT must be a number",
		);
	});

	it("emits VALIDATION_FAILED with issues array in JSON mode", async () => {
		const issues = [
			{
				path: "PORT",
				message: "must be a number (was a string)",
				code: "INVALID_TYPE" as const,
			},
		];

		vi.mocked(schemaLoader.validate).mockResolvedValue({
			ok: false,
			kind: "validation",
			message:
				"Errors found while validating environment variables\n  PORT must be a number",
			issues,
		});

		const result = await useCase.execute({
			schema: "./src/env.ts",
			isJson: true,
		});

		expect(result).toBe(false);
		expect(logger.json).toHaveBeenCalledWith({
			status: "error",
			code: "VALIDATION_FAILED",
			message: "Errors found while validating environment variables",
			issues,
		});
	});
});
