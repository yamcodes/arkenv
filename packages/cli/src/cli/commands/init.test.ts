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
			hasPackageJson: vi.fn().mockResolvedValue(true),
			isEmptyDirectory: vi.fn().mockResolvedValue(false),
			checkTsConfig: vi.fn().mockResolvedValue({ status: "strict" }),
			detectFramework: vi.fn().mockResolvedValue("vanilla"),
			suggestDefaultEnvPath: vi.fn().mockResolvedValue("./env.ts"),
			getEnvExampleKeys: vi.fn().mockResolvedValue(null),
			detectPackageManager: vi.fn().mockResolvedValue("pnpm"),
		} as unknown as ProjectScannerPort;

		useCase = new InitUseCase(logger, workspace, prompt, scanner);
	});

	it("should enter new project flow if no package.json and empty directory", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			template: "basic",
			name: "my-project",
			path: "./src/env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result.mode).toBe("new");
		expect(prompt.runWizard).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: "new",
				templates: expect.any(Array),
			}),
			false,
		);
	});
});
