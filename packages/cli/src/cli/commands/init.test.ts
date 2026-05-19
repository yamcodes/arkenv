import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";
import { InitUseCase } from "./init";

describe("InitUseCase", () => {
	let logger: LoggerPort;
	let workspace: WorkspacePort;
	let prompt: PromptPort;
	let scanner: ProjectScannerPort;
	let useCase: InitUseCase;

	beforeEach(() => {
		logger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn(),
			step: vi.fn(),
			success: vi.fn(),
			cancel: vi.fn(),
			note: vi.fn(),
			finish: vi.fn(),
			spinner: vi.fn().mockReturnValue({
				start: vi.fn(),
				stop: vi.fn(),
			}),
			interactiveStdout: vi.fn(),
		} as unknown as LoggerPort;

		workspace = {
			exists: vi.fn(),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
			execute: vi.fn(),
		} as unknown as WorkspacePort;

		prompt = {
			confirm: vi.fn(),
			runWizard: vi.fn(),
		} as unknown as PromptPort;

		scanner = {
			checkRequirements: vi.fn().mockResolvedValue([]),
			checkTsConfig: vi.fn().mockResolvedValue({ status: "strict" }),
			detectFramework: vi.fn().mockResolvedValue("vanilla"),
			suggestDefaultEnvPath: vi.fn().mockResolvedValue("./env.ts"),
			getEnvExampleKeys: vi.fn().mockResolvedValue(null),
			detectPackageManager: vi.fn().mockResolvedValue("pnpm"),
		} as unknown as ProjectScannerPort;

		useCase = new InitUseCase(logger, workspace, prompt, scanner);
	});

	it("should exit early if requirements fail", async () => {
		vi.mocked(scanner.checkRequirements).mockResolvedValue([
			{
				status: "fail",
				requirement: "Node.js Version",
				message: "Node.js version must be >= 22.0.0",
				current: "20.0.0",
				expected: ">= 22.0.0",
			},
		]);

		const result = await (useCase as any).collect({
			isYes: true,
			isForce: false,
			isQuiet: true,
			isAgent: false,
		});

		expect(result).toBeNull();
		expect(logger.error).toHaveBeenCalledWith(
			"Technical requirements not met:",
		);
		expect(logger.info).toHaveBeenCalledWith(
			"Use --force to bypass these checks.",
		);
	});

	it("should continue if requirements fail but --force is used", async () => {
		vi.mocked(scanner.checkRequirements).mockResolvedValue([
			{
				status: "fail",
				requirement: "Node.js Version",
				message: "Node.js version must be >= 22.0.0",
			},
		]);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			isYes: true,
			isForce: true,
			isQuiet: true,
			isAgent: false,
		});

		expect(result).not.toBeNull();
		expect(logger.warn).toHaveBeenCalledWith(
			"Technical requirements not met, but continuing due to --force flag.",
		);
	});

	it("should display warnings if requirements have warnings", async () => {
		vi.mocked(scanner.checkRequirements).mockResolvedValue([
			{
				status: "warn",
				requirement: "package.json",
				message: "package.json not found",
			},
		]);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		await (useCase as any).collect({
			isYes: true,
			isForce: false,
			isQuiet: true,
			isAgent: false,
		});

		expect(logger.warn).toHaveBeenCalledWith(
			"package.json: package.json not found",
		);
	});
});
