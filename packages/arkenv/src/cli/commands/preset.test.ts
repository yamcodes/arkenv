import path from "node:path";
import dedent from "dedent";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@/shared/errors";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";
import { detectValidator, PresetUseCase } from "./preset";

describe("PresetUseCase", () => {
	let logger: LoggerPort;
	let workspace: WorkspacePort;
	let prompt: PromptPort;
	let scanner: ProjectScannerPort;
	let useCase: PresetUseCase;

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
			refuse: vi.fn(),
			spinner: vi.fn().mockReturnValue({
				start: vi.fn(),
				stop: vi.fn(),
			}),
			interactiveStdout: vi.fn(),
		} as unknown as LoggerPort;

		workspace = {
			exists: vi.fn().mockImplementation(async (p: string) => {
				if (p.endsWith("client.ts") || p.endsWith("server.ts")) {
					return false;
				}
				return true;
			}),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
			execute: vi.fn(),
			appendMissingEnvExampleKeys: vi.fn().mockResolvedValue(true),
			removeEnvExampleKeys: vi.fn().mockResolvedValue(true),
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
			findPackageJson: vi.fn().mockResolvedValue("/root/package.json"),
			readArkenvConfig: vi.fn().mockResolvedValue(null),
		} as unknown as ProjectScannerPort;

		useCase = new PresetUseCase(logger, workspace, prompt, scanner);
	});

	describe("git working tree gating", () => {
		it("refuses execution when git working tree is dirty and --force is not passed", async () => {
			vi.mocked(scanner.checkGitStatus).mockResolvedValue({ status: "dirty" });

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Git working tree is not clean"),
			);
			expect(logger.refuse).toHaveBeenCalledWith({
				code: ERROR_CODES.GIT_TREE_DIRTY,
				message: "Git working tree is not clean.",
				retryWith: ["--force"],
			});
			expect(workspace.writeFile).not.toHaveBeenCalled();
		});

		it("proceeds when git working tree is dirty if isForce is true", async () => {
			vi.mocked(scanner.checkGitStatus).mockResolvedValue({ status: "dirty" });
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
				isForce: true,
			});

			expect(result).toBe(true);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("continuing due to --force flag"),
			);
			expect(workspace.writeFile).toHaveBeenCalled();
		});

		it("proceeds when not_a_repo", async () => {
			vi.mocked(scanner.checkGitStatus).mockResolvedValue({
				status: "not_a_repo",
			});
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalled();
		});
	});

	describe("preset apply", () => {
		it("applies managed preset block with markers to flat schema", async () => {
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("env.ts"),
				expect.stringContaining("// @arkenv-preset-start vercel"),
			);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("env.ts"),
				expect.stringContaining('VERCEL: "string?"'),
			);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("env.ts"),
				expect.stringContaining("// @arkenv-preset-end vercel"),
			);
			expect(workspace.appendMissingEnvExampleKeys).toHaveBeenCalled();
			expect(logger.success).toHaveBeenCalledWith(
				expect.stringContaining("Applied Vercel preset to env.ts"),
			);
		});

		it("uses package.json arkenv schema pointer when discovered", async () => {
			vi.mocked(scanner.readArkenvConfig).mockResolvedValue({
				schema: "./src/config/env.ts",
				layout: "flat",
			});
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.includes("src/config/env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("src/config/env.ts"),
				expect.stringContaining("// @arkenv-preset-start vercel"),
			);
		});

		it("honors --file override over package.json pointer", async () => {
			vi.mocked(scanner.readArkenvConfig).mockResolvedValue({
				schema: "./src/config/env.ts",
				layout: "flat",
			});
			const customFile = path.resolve(process.cwd(), "custom/env.ts");
			vi.mocked(workspace.exists).mockImplementation(
				async (p: string) => p === customFile,
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
				file: "custom/env.ts",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				customFile,
				expect.stringContaining("// @arkenv-preset-start vercel"),
			);
		});

		it("applies role-suffixed blocks to strict layout", async () => {
			const clientPath = path.resolve(process.cwd(), "env/client.ts");
			const serverPath = path.resolve(process.cwd(), "env/server.ts");

			vi.mocked(workspace.exists).mockImplementation(
				async (p: string) => p === clientPath || p === serverPath,
			);

			vi.mocked(workspace.readFile).mockImplementation(async (p: string) => {
				if (p === clientPath) {
					return `import arkenv from "@arkenv/nextjs/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	{
		NEXT_PUBLIC_URL: "string",
	},
	{
		extends: [SharedSchema],
	},
);`;
				}
				if (p === serverPath) {
					return `import arkenv from "@arkenv/nextjs/server";

export const env = arkenv(
	{
		DATABASE_URL: "string",
	},
);`;
				}
				return "";
			});

			vi.mocked(scanner.detectFramework).mockResolvedValue("nextjs");

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				clientPath,
				expect.stringContaining("// @arkenv-preset-start vercel:client"),
			);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				serverPath,
				expect.stringContaining("// @arkenv-preset-start vercel:server"),
			);
			expect(logger.success).toHaveBeenCalledWith(
				expect.stringContaining(
					"Applied Vercel preset to env/client.ts and env/server.ts",
				),
			);
		});

		it("fails closed on unmarked key collision", async () => {
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
					VERCEL: "string?",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Collision"),
			);
			expect(workspace.writeFile).not.toHaveBeenCalled();
		});

		it("fails closed on malformed markers in schema", async () => {
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
				});
			`);

			const result = await useCase.execute({
				action: "apply",
				provider: "vercel",
			});

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Malformed preset markers"),
			);
		});
	});

	describe("preset remove", () => {
		it("removes managed preset block from flat schema and updates .env.example", async () => {
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					DATABASE_URL: "string",
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					VERCEL_ENV: "'production' | 'preview' | 'development'?",
					// @arkenv-preset-end vercel
				});
			`);

			const result = await useCase.execute({
				action: "remove",
				provider: "vercel",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("env.ts"),
				expect.not.stringContaining("VERCEL"),
			);
			expect(workspace.removeEnvExampleKeys).toHaveBeenCalledWith(
				expect.any(String),
				expect.arrayContaining(["VERCEL", "VERCEL_ENV"]),
				[],
			);
			expect(logger.success).toHaveBeenCalledWith(
				expect.stringContaining("Removed Vercel preset from env.ts"),
			);
		});

		it("removes role-suffixed managed preset blocks from strict layout", async () => {
			const clientPath = path.resolve(process.cwd(), "env/client.ts");
			const serverPath = path.resolve(process.cwd(), "env/server.ts");

			vi.mocked(workspace.exists).mockImplementation(
				async (p: string) => p === clientPath || p === serverPath,
			);

			vi.mocked(workspace.readFile).mockImplementation(async (p: string) => {
				if (p === clientPath) {
					return dedent`
						import arkenv from "./generated/env.gen";
						export const env = arkenv({
							// @arkenv-preset-start vercel:client
							NEXT_PUBLIC_VERCEL_ENV: "string?",
							// @arkenv-preset-end vercel:client
						});
					`;
				}
				if (p === serverPath) {
					return dedent`
						import arkenv from "./generated/env.gen";
						export const env = arkenv({
							DATABASE_URL: "string",
							// @arkenv-preset-start vercel:server
							VERCEL: "string?",
							// @arkenv-preset-end vercel:server
						});
					`;
				}
				return "";
			});

			const result = await useCase.execute({
				action: "remove",
				provider: "vercel",
			});

			expect(result).toBe(true);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				clientPath,
				expect.not.stringContaining("NEXT_PUBLIC_VERCEL_ENV"),
			);
			expect(workspace.writeFile).toHaveBeenCalledWith(
				serverPath,
				expect.not.stringContaining("VERCEL:"),
			);
			expect(logger.success).toHaveBeenCalledWith(
				expect.stringContaining(
					"Removed Vercel preset from env/client.ts and env/server.ts",
				),
			);
		});

		it("fails closed on malformed markers during remove", async () => {
			vi.mocked(workspace.exists).mockImplementation(async (p: string) =>
				p.endsWith("env.ts"),
			);
			vi.mocked(workspace.readFile).mockResolvedValue(dedent`
				import { type } from "@arkenv/core";

				export const Env = type({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
				});
			`);

			const result = await useCase.execute({
				action: "remove",
				provider: "vercel",
			});

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining("Malformed preset markers"),
			);

			expect(workspace.writeFile).not.toHaveBeenCalled();
		});
	});

	describe("detectValidator", () => {
		it("detects zod from import statements", () => {
			const code = 'import { z } from "zod";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("zod");
		});

		it("detects valibot from import statements", () => {
			const code =
				'import * as v from "valibot";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("valibot");
		});

		it("defaults to arktype when no zod or valibot import is present", () => {
			const code =
				'import arkenv from "./generated/env.gen";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("arktype");
		});

		it("ignores commented-out zod imports", () => {
			const code =
				'// import { z } from "zod"\nimport arkenv from "./generated/env.gen";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("arktype");
		});

		it("detects zod from multi-line import statements", () => {
			const code =
				'import {\n  z,\n} from "zod";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("zod");
		});

		it("detects valibot from multi-line import statements", () => {
			const code =
				'import {\n  string,\n  optional,\n} from "valibot";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("valibot");
		});

		it("ignores multi-line commented-out valibot imports", () => {
			const code =
				'/*\n import * as v from "valibot"\n*/\nimport arkenv from "./generated/env.gen";\nexport const env = arkenv({});';
			expect(detectValidator(code)).toBe("arktype");
		});
	});
});
