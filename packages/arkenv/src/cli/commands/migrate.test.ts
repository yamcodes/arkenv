import { describe, expect, it, vi } from "vitest";
import type {
	LoggerPort,
	ProjectScannerPort,
	PromptPort,
	WorkspacePort,
} from "@/shared/ports";
import { MigrateUseCase } from "./migrate";

describe("MigrateUseCase", () => {
	const createMocks = () => {
		const logger: LoggerPort = {
			step: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn((_msg: string, _err?: unknown) => {
				throw new Error("fatal");
			}),
			cancel: vi.fn(),
			finish: vi.fn(),
			log: vi.fn(),
			flush: vi.fn(),
			stdio: "inherit",
		} as unknown as LoggerPort;

		const files: Record<string, string> = {};

		const workspace: WorkspacePort = {
			exists: vi.fn(async (p: string) => Boolean(files[p])),
			readFile: vi.fn(async (p: string) => files[p] || ""),
			writeFile: vi.fn(async (p: string, c: string) => {
				files[p] = c;
			}),
			findViteConfig: vi.fn(async () => {
				for (const p of Object.keys(files)) {
					if (p.includes("vite.config")) return p;
				}
				return undefined;
			}),
		} as unknown as WorkspacePort;

		const prompt: PromptPort = {
			confirm: vi.fn(async () => true),
			select: vi.fn(),
			runWizard: vi.fn(),
		};

		return { logger, workspace, prompt, files };
	};

	it("runs dry-run without writing files", async () => {
		const { logger, workspace, prompt, files } = createMocks();
		const cwd = process.cwd();
		files[`${cwd}/src/env.ts`] = `
import { type } from "arktype";
export const Env = type({ PORT: "number" });
`;
		files[`${cwd}/package.json`] = JSON.stringify({
			dependencies: { arkenv: "^0.9.0" },
		});

		const useCase = new MigrateUseCase(logger, workspace, prompt);
		const success = await useCase.execute({ isDryRun: true });

		expect(success).toBe(true);
		expect(workspace.writeFile).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("Dry run completed"),
		);
	});

	it("applies changes when confirmed", async () => {
		const { logger, workspace, prompt, files } = createMocks();
		const cwd = process.cwd();
		files[`${cwd}/src/env.ts`] = `
import { type } from "arktype";
export const Env = type({ PORT: "number" });
`;
		files[`${cwd}/package.json`] = JSON.stringify({
			dependencies: { arkenv: "^0.9.0" },
		});

		const useCase = new MigrateUseCase(logger, workspace, prompt);
		const success = await useCase.execute({ isYes: true });

		expect(success).toBe(true);
		expect(workspace.writeFile).toHaveBeenCalledTimes(2);
		expect(files[`${cwd}/src/env.ts`]).toContain("export const env = arkenv({");
		expect(files[`${cwd}/package.json`]).toContain("@arkenv/core");
	});

	it("reports already on v1 when no legacy patterns detected", async () => {
		const { logger, workspace, prompt, files } = createMocks();
		const cwd = process.cwd();
		files[`${cwd}/src/env.ts`] = `
import arkenv from "@arkenv/core";
export const env = arkenv({ PORT: "number" });
export default env;
`;
		files[`${cwd}/package.json`] = JSON.stringify({
			dependencies: { "@arkenv/core": "^1.0.0" },
		});

		const useCase = new MigrateUseCase(logger, workspace, prompt);
		const success = await useCase.execute({ isYes: true });

		expect(success).toBe(true);
		expect(workspace.writeFile).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("already on the v1 canonical env-object surface"),
		);
	});
});
