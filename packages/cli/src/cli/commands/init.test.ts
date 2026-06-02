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
			exists: vi.fn().mockImplementation(async (p: string) => {
				if (p.endsWith(".ts") || p.endsWith(".json") || p.endsWith(".yaml")) {
					return false;
				}
				return true;
			}),
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
			checkRequirements: vi.fn().mockResolvedValue([]),
			checkTsConfig: vi.fn().mockResolvedValue({ status: "strict" }),
			detectFramework: vi.fn().mockResolvedValue("vanilla"),
			suggestDefaultEnvPath: vi.fn().mockResolvedValue("./env.ts"),
			getEnvExampleKeys: vi.fn().mockResolvedValue(null),
			detectPackageManager: vi.fn().mockResolvedValue("pnpm"),
			hasSkill: vi.fn().mockResolvedValue(false),
		} as unknown as ProjectScannerPort;

		useCase = new InitUseCase(logger, workspace, prompt, scanner);
	});

	it("should enter new project flow if no package.json and empty directory", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
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
				examples: expect.any(Array),
			}),
			false,
		);
	});

	it("should error if no package.json and not empty directory and not forced", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(false);

		const result = await (useCase as any).collect({
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result).toBeNull();
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Directory is not empty and no"),
		);
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("--force"),
		);
	});

	it("should bypass empty check and enter new project flow if no package.json, not empty directory, and isForce is true", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(false);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
			name: "my-project",
			path: "./src/env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			isYes: false,
			isForce: true,
			isQuiet: false,
			isAgent: false,
		});

		expect(result.mode).toBe("new");
	});

	it("should force new project flow if --example is passed even in non-empty directory", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(false);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
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
			example: "basic",
		});

		expect(result).not.toBeNull();
		expect(result.mode).toBe("new");
		expect(prompt.runWizard).toHaveBeenCalledWith(
			expect.objectContaining({ mode: "new", example: "basic" }),
			false,
		);
	});

	it("should force new project flow if --example is passed even when package.json exists", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(true);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(false);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
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
			example: "basic",
		});

		expect(result).not.toBeNull();
		expect(result.mode).toBe("new");
		// collectExistingProject should never have been called (no requirement checks)
		expect(scanner.checkRequirements).not.toHaveBeenCalled();
	});

	it("should abort with non-empty error when --example and project-name '.' are used in a non-empty directory", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(false);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
			name: ".",
			path: "./src/env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			isYes: true,
			isForce: false,
			isQuiet: false,
			isAgent: false,
			example: "basic",
			name: ".",
		});

		expect(result).toBeNull();
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Cannot scaffold into"),
		);
	});

	it("should allow scaffolding when --example, project-name '.', and --force are used in a non-empty directory", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(false);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
			name: ".",
			path: "./src/env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			isYes: true,
			isForce: true,
			isQuiet: false,
			isAgent: false,
			example: "basic",
			name: ".",
		});

		expect(result).not.toBeNull();
		expect(result.mode).toBe("new");
		expect(logger.error).not.toHaveBeenCalled();
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

		const result = await useCase.execute({
			isYes: true,
			isForce: false,
			isQuiet: true,
			isAgent: false,
		});

		expect(result).toBe(false);
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

	it("should resolve target directory to subdirectory when project-name positional argument is provided", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			name: "my-project",
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result.cwd).toContain("my-project");
		expect(scanner.hasPackageJson).toHaveBeenCalledWith(
			expect.stringContaining("my-project"),
		);
		expect(scanner.checkTsConfig).toHaveBeenCalledWith(
			expect.stringContaining("my-project"),
		);
	});

	it("should resolve target directory to process.cwd() when project-name is '.'", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			name: ".",
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result.cwd).toBe(process.cwd());
		expect(scanner.hasPackageJson).toHaveBeenCalledWith(process.cwd());
	});

	it("should resolve target directory to process.cwd() and normalize input name to '.' when project-name resolves to current directory", async () => {
		vi.mocked(scanner.hasPackageJson).mockResolvedValue(false);
		vi.mocked(scanner.isEmptyDirectory).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			mode: "new",
			example: "basic",
			name: ".",
			path: "./src/env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			name: "./",
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result.cwd).toBe(process.cwd());
		expect(prompt.runWizard).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: "new",
				name: ".",
			}),
			false,
		);
	});

	it("should detect installed arkenv skill, log a message, and skip prompt setting installSkill to false", async () => {
		vi.mocked(scanner.hasSkill).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./env.ts",
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

		expect(result).not.toBeNull();
		expect(result.options.installSkill).toBe(false);
		expect(result.options.skillDetected).toBe(true);
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("ArkEnv agent skill detected."),
		);
		expect(prompt.confirm).not.toHaveBeenCalled();
	});

	it("should detect installed arkenv skill and skip prompt setting installSkill to false even with isYes = true", async () => {
		vi.mocked(scanner.hasSkill).mockResolvedValue(true);
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./env.ts",
			validator: "arktype",
			framework: "vanilla",
			language: "ts",
		});

		const result = await (useCase as any).collect({
			isYes: true,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result).not.toBeNull();
		expect(result.options.installSkill).toBe(false);
		expect(result.options.skillDetected).toBe(true);
	});

	it("should prompt for Next.js config wrapping when framework is nextjs", async () => {
		vi.mocked(scanner.checkTsConfig).mockResolvedValue({ status: "strict" });
		vi.mocked(scanner.detectFramework).mockResolvedValue("nextjs");
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./src/env.ts",
			validator: "arktype",
			framework: "nextjs",
			language: "ts",
			disableCodegen: false,
		});
		vi.mocked(prompt.confirm).mockResolvedValueOnce(true);

		const result = await (useCase as any).collect({
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result).not.toBeNull();
		expect(result.options.wrapNextjsConfig).toBe(true);
		expect(prompt.confirm).toHaveBeenCalledWith(
			"Would you like to wrap your Next.js config with withArkEnv?",
			true,
			"Yes (Recommended)",
		);
	});

	it("should set wrapNextjsConfig to false when user declines", async () => {
		vi.mocked(scanner.checkTsConfig).mockResolvedValue({ status: "strict" });
		vi.mocked(scanner.detectFramework).mockResolvedValue("nextjs");
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./src/env.ts",
			validator: "arktype",
			framework: "nextjs",
			language: "ts",
			disableCodegen: false,
		});
		vi.mocked(prompt.confirm).mockResolvedValueOnce(false);

		const result = await (useCase as any).collect({
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result).not.toBeNull();
		expect(result.options.wrapNextjsConfig).toBe(false);
	});

	it("should default wrapNextjsConfig to true in isYes mode for nextjs", async () => {
		vi.mocked(scanner.checkTsConfig).mockResolvedValue({ status: "strict" });
		vi.mocked(scanner.detectFramework).mockResolvedValue("nextjs");
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./src/env.ts",
			validator: "arktype",
			framework: "nextjs",
			language: "ts",
			disableCodegen: false,
			wrapNextjsConfig: true,
		});

		const result = await (useCase as any).collect({
			isYes: true,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result).not.toBeNull();
		expect(result.options.wrapNextjsConfig).toBe(true);
		expect(prompt.confirm).not.toHaveBeenCalled();
	});

	it("should not prompt for Next.js config wrapping when disableCodegen is true", async () => {
		vi.mocked(scanner.checkTsConfig).mockResolvedValue({ status: "strict" });
		vi.mocked(scanner.detectFramework).mockResolvedValue("nextjs");
		vi.mocked(prompt.runWizard).mockResolvedValue({
			path: "./src/env.ts",
			validator: "arktype",
			framework: "nextjs",
			language: "ts",
			disableCodegen: true,
		});
		vi.mocked(prompt.confirm).mockResolvedValueOnce(false);

		const result = await (useCase as any).collect({
			isYes: false,
			isForce: false,
			isQuiet: false,
			isAgent: false,
		});

		expect(result).not.toBeNull();
		expect(result.options.wrapNextjsConfig).toBeUndefined();
		expect(prompt.confirm).not.toHaveBeenCalledWith(
			"Would you like to wrap your Next.js config with withArkEnv?",
			expect.anything(),
			expect.anything(),
		);
	});
});
