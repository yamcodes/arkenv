import dedent from "dedent";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";
import { AddUseCase } from "./add";

describe("AddUseCase", () => {
	let logger: LoggerPort;
	let workspace: WorkspacePort;
	let prompt: PromptPort;
	let scanner: ProjectScannerPort;
	let useCase: AddUseCase;

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
			log: vi.fn(),
			spinner: vi.fn().mockReturnValue({
				start: vi.fn(),
				stop: vi.fn(),
			}),
			interactiveStdout: vi.fn(),
		} as unknown as LoggerPort;

		workspace = {
			exists: vi.fn().mockResolvedValue(true),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
			execute: vi.fn(),
		} as unknown as WorkspacePort;

		prompt = {
			confirm: vi.fn(),
			runWizard: vi.fn(),
			select: vi.fn(),
		} as unknown as PromptPort;

		scanner = {
			hasPackageJson: vi.fn().mockResolvedValue(true),
			isEmptyDirectory: vi.fn().mockResolvedValue(false),
			checkRequirements: vi.fn().mockResolvedValue([]),
			checkTsConfig: vi
				.fn()
				.mockResolvedValue({ status: "strict", parsed: null }),
			detectFramework: vi.fn().mockResolvedValue("vanilla"),
			suggestDefaultEnvPath: vi.fn().mockResolvedValue("./env.ts"),
			getEnvExampleKeys: vi.fn().mockResolvedValue(null),
			detectPackageManager: vi.fn().mockResolvedValue("pnpm"),
			hasSkill: vi.fn().mockResolvedValue(false),
			checkGitStatus: vi.fn().mockResolvedValue({ status: "clean" }),
		} as unknown as ProjectScannerPort;

		useCase = new AddUseCase(logger, workspace, prompt, scanner);
	});

	it("prompts for provider if omitted", async () => {
		vi.mocked(prompt.select).mockResolvedValue("vercel");
		vi.mocked(workspace.exists).mockResolvedValue(true);
		vi.mocked(workspace.readFile).mockResolvedValue(dedent`
			import { type } from "arkenv";
			export const Env = type({
				DATABASE_URL: "string",
			});
		`);

		const result = await useCase.execute({});
		expect(result).toBe(true);
		expect(prompt.select).toHaveBeenCalled();
		expect(workspace.writeFile).toHaveBeenCalled();
		expect(logger.success).toHaveBeenCalledWith(
			expect.stringContaining("Added Vercel"),
		);
	});

	it("mutates env.ts with preset keys", async () => {
		vi.mocked(workspace.exists).mockResolvedValue(true);
		vi.mocked(workspace.readFile).mockResolvedValue(dedent`
			import { type } from "arkenv";
			export const Env = type({
				DATABASE_URL: "string",
			});
		`);

		const result = await useCase.execute({ provider: "vercel" });
		expect(result).toBe(true);
		expect(workspace.writeFile).toHaveBeenCalledWith(
			expect.stringContaining("env.ts"),
			expect.stringContaining('VERCEL: "string?"'),
		);
		expect(logger.success).toHaveBeenCalledWith(
			expect.stringContaining("Added Vercel"),
		);
	});

	it("does not mutate if keys are already present", async () => {
		vi.mocked(workspace.exists).mockResolvedValue(true);
		vi.mocked(workspace.readFile).mockResolvedValue(dedent`
			import { type } from "arkenv";
			export const Env = type({
				DATABASE_URL: "string",
				VERCEL: "string?",
				VERCEL_ENV: "'production' | 'preview' | 'development'?",
				VERCEL_URL: "string?",
			});
		`);

		const result = await useCase.execute({ provider: "vercel" });
		expect(result).toBe(true);
		expect(workspace.writeFile).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("already present"),
		);
	});

	it("logs proposed keys to stdout if env.ts does not exist", async () => {
		vi.mocked(workspace.exists).mockResolvedValue(false);

		const result = await useCase.execute({ provider: "vercel" });
		expect(result).toBe(true);
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Could not locate"),
		);
		expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("VERCEL:"));
	});

	it("logs proposed keys to stdout if env.ts is not parseable", async () => {
		vi.mocked(workspace.exists).mockResolvedValue(true);
		vi.mocked(workspace.readFile).mockResolvedValue("export const x = 123;");

		const result = await useCase.execute({ provider: "vercel" });
		expect(result).toBe(true);
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Could not find arkenv or type schema call"),
		);
		expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("VERCEL:"));
	});
});
