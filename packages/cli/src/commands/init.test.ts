import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLI } from "../cli";
import * as prompts from "../prompts";
import * as scaffold from "../scaffold";
import { InitCommand } from "./init";

const { spawnMock } = vi.hoisted(() => ({
	spawnMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
	spawn: spawnMock,
}));

vi.mock("@clack/prompts", () => ({
	confirm: vi.fn(),
	isCancel: vi.fn(),
	spinner: vi.fn().mockReturnValue({
		start: vi.fn(),
		stop: vi.fn(),
	}),
	cancel: vi.fn(),
	outro: vi.fn(),
	note: vi.fn(),
}));

describe("InitCommand", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "cli-init-test-"));
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
		vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});

		spawnMock.mockReset();
		spawnMock.mockReturnValue({
			stdout: new Readable({ read() {} }),
			stderr: new Readable({ read() {} }),
			on: vi.fn((event, cb) => {
				if (event === "close") {
					setTimeout(() => cb(0), 0);
				}
			}),
		});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	it("passes --yes to skill installation when isYes is true", async () => {
		const cli = new CLI(["node", "bin", "init", "--yes"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("node");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "node",
			path: "env.ts",
			language: "ts",
			installSkill: true,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: "npm install",
			packageManager: "npm",
			typeDefinitionResult: { status: "none" },
		} as any);

		await command.run();

		expect(spawnMock).toHaveBeenCalledWith(
			expect.stringContaining("skills add yamcodes/arkenv --yes"),
			expect.anything(),
			expect.anything(),
		);
	});

	it("does NOT pass --yes to skill installation when isYes is false", async () => {
		const cli = new CLI(["node", "bin", "init"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("node");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "node",
			path: "env.ts",
			language: "ts",
			installSkill: true,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: "npm install",
			packageManager: "npm",
			typeDefinitionResult: { status: "none" },
		} as any);

		await command.run();

		expect(spawnMock).toHaveBeenCalledWith(
			expect.stringMatching(/skills add yamcodes\/arkenv(?!.*--yes)/),
			expect.anything(),
			expect.anything(),
		);
	});

	it("uses stdio: 'pipe' for skill installation when isQuiet is true", async () => {
		const cli = new CLI(["node", "bin", "init", "--quiet"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("node");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "node",
			path: "env.ts",
			language: "ts",
			installSkill: true,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: "npm install",
			packageManager: "npm",
			typeDefinitionResult: { status: "none" },
		} as any);

		await command.run();

		// Skill installation should use pipe
		expect(spawnMock).toHaveBeenCalledWith(
			expect.stringContaining("skills add yamcodes/arkenv"),
			expect.anything(),
			expect.objectContaining({ stdio: "pipe" }),
		);
	});

	it("includes error logs in fatal message when quiet installation fails", async () => {
		const cli = new CLI(["node", "bin", "init", "--quiet"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("node");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "node",
			path: "env.ts",
			language: "ts",
			installSkill: true,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: "npm install",
			packageManager: "npm",
			typeDefinitionResult: { status: "none" },
		} as any);

		const stdout = new Readable({ read() {} });
		const stderr = new Readable({ read() {} });

		spawnMock.mockReturnValueOnce({
			stdout,
			stderr,
			on: (event: string, cb: any) => {
				if (event === "close") {
					setTimeout(() => cb(1), 0);
				}
			},
		});

		const fatalSpy = vi.spyOn(cli.logger, "fatal").mockImplementation(() => {
			throw new Error("fatal called");
		});

		// Trigger data on streams
		setTimeout(() => {
			stdout.push("some output");
			stdout.push(null);
			stderr.push("error details");
			stderr.push(null);
		}, 0);

		await expect(command.run()).rejects.toThrow("fatal called");

		expect(fatalSpy).toHaveBeenCalledWith(
			expect.stringContaining("Scaffolding failed"),
			expect.objectContaining({
				message: expect.stringContaining("error details"),
			}),
		);
	});

	it("caps the output buffers in quiet mode", async () => {
		const cli = new CLI(["node", "bin", "init", "--quiet"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("node");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "node",
			path: "env.ts",
			language: "ts",
			installSkill: true,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: "npm install",
			packageManager: "npm",
			typeDefinitionResult: { status: "none" },
		} as any);

		const stdout = new Readable({ read() {} });
		const stderr = new Readable({ read() {} });

		spawnMock.mockReturnValueOnce({
			stdout,
			stderr,
			on: (event: string, cb: any) => {
				if (event === "close") {
					setTimeout(() => cb(1), 0);
				}
			},
		});

		const fatalSpy = vi.spyOn(cli.logger, "fatal").mockImplementation(() => {
			throw new Error("fatal called");
		});

		// Trigger large data on streams
		const largeData = "A".repeat(11_000);
		const expectedData = "A".repeat(10_000);

		setTimeout(() => {
			stdout.push(largeData);
			stdout.push(null);
			stderr.push("error");
			stderr.push(null);
		}, 0);

		await expect(command.run()).rejects.toThrow("fatal called");

		expect(fatalSpy).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				message: expect.not.stringContaining(largeData),
			}),
		);
		expect(fatalSpy).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				message: expect.stringContaining(expectedData),
			}),
		);
	});

	it("includes signal in error message when process is terminated by signal (code is null)", async () => {
		const cli = new CLI(["node", "bin", "init", "--quiet"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("node");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "node",
			path: "env.ts",
			language: "ts",
			installSkill: true,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: "npm install",
			packageManager: "npm",
			typeDefinitionResult: { status: "none" },
		} as any);

		spawnMock.mockReturnValueOnce({
			stdout: new Readable({ read() {} }),
			stderr: new Readable({ read() {} }),
			on: (event: string, cb: any) => {
				if (event === "close") {
					setTimeout(() => cb(null, "SIGTERM"), 0);
				}
			},
		});

		const fatalSpy = vi.spyOn(cli.logger, "fatal").mockImplementation(() => {
			throw new Error("fatal called");
		});

		await expect(command.run()).rejects.toThrow("fatal called");

		expect(fatalSpy).toHaveBeenCalledWith(
			expect.stringContaining("Scaffolding failed"),
			expect.objectContaining({
				message: expect.stringContaining(
					"Command terminated by signal SIGTERM",
				),
			}),
		);
	});

	it("logs type definition creation results", async () => {
		const cli = new CLI(["node", "bin", "init"]);
		const command = new InitCommand(cli);

		vi.spyOn(scaffold, "checkTsConfig").mockResolvedValue({ status: "strict" });
		vi.spyOn(scaffold, "detectFramework").mockResolvedValue("vite");
		vi.spyOn(prompts, "runPromptWizard").mockResolvedValue({
			validator: "arktype",
			framework: "vite",
			path: "env.ts",
			language: "ts",
			installSkill: false,
		});
		vi.spyOn(scaffold, "scaffold").mockResolvedValue({
			tsConfigResult: { status: "already_strict" },
			installCmd: undefined,
			packageManager: "npm",
			typeDefinitionResult: { status: "created", file: "vite-env.d.ts" },
		} as any);

		const infoSpy = vi.spyOn(cli.logger, "info");
		await command.run();

		expect(
			infoSpy.mock.calls.some(
				(call) =>
					typeof call[0] === "string" &&
					call[0].includes("Created") &&
					call[0].includes("vite-env.d.ts"),
			),
		).toBe(true);
	});
});
