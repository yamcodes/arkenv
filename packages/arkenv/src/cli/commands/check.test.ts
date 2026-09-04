import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JitiSchemaLoaderAdapter } from "@/adapters/jiti-schema-loader";
import { Logger } from "@/adapters/logger.adapter";
import { NodeProjectScannerAdapter } from "@/adapters/node-project-scanner";
import { NodeWorkspace } from "@/adapters/node-workspace";
import { MemoryReporter } from "@/adapters/reporters/memory.reporter";
import { CheckUseCase } from "@/cli/commands/check";

describe("CheckUseCase", () => {
	let tempDir: string;
	let memoryReporter: MemoryReporter;
	let logger: Logger;
	let workspace: NodeWorkspace;
	let scanner: NodeProjectScannerAdapter;
	let schemaLoader: JitiSchemaLoaderAdapter;
	let useCase: CheckUseCase;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkenv-check-test-"));
		memoryReporter = new MemoryReporter();
		logger = new Logger({
			reporter: memoryReporter,
			isQuiet: false,
			isJson: false,
		});
		workspace = new NodeWorkspace(false, "pipe", logger);
		scanner = new NodeProjectScannerAdapter(logger);
		schemaLoader = new JitiSchemaLoaderAdapter({
			jitiAliases: {
				"@arkenv/core": path.resolve(
					__dirname,
					"../../../../core/src/index.ts",
				),
				"@arkenv/core/issues": path.resolve(
					__dirname,
					"../../../../core/src/issues.ts",
				),
				arkenv: path.resolve(__dirname, "../../../../core/src/index.ts"),
			},
		});
		useCase = new CheckUseCase(logger, workspace, scanner, schemaLoader);
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
	});

	it("returns exit code 2 when schema file cannot be found", async () => {
		const exitCode = await useCase.execute({ cwd: tempDir });
		expect(exitCode).toBe(2);
		expect(memoryReporter.logs.some((l) => l.type === "error")).toBe(true);
	});

	it("emits CLI.SCHEMA_NOT_FOUND in JSON mode when schema file is missing", async () => {
		(logger as any).options.isJson = true;
		const exitCode = await useCase.execute({ cwd: tempDir });
		expect(exitCode).toBe(2);

		const reports = memoryReporter.logs.filter(
			(l) => l.type === "reportErrored",
		);
		expect(reports).toHaveLength(1);
		expect(reports[0].data).toMatchObject({
			ok: false,
			commandId: "check",
			error: {
				code: "CLI.SCHEMA_NOT_FOUND",
				severity: "error",
				summary: expect.stringContaining("Could not locate your schema file"),
				nextActions: [
					{
						kind: "run-command",
						label: "Initialize a new ArkEnv schema",
					},
				],
			},
		});
	});

	it("returns exit code 2 when --schema specifies a non-existent file", async () => {
		const exitCode = await useCase.execute({
			schema: "./non-existent.ts",
			cwd: tempDir,
		});
		expect(exitCode).toBe(2);
		expect(
			memoryReporter.logs.some(
				(l) => l.type === "error" && l.message.includes("not found"),
			),
		).toBe(true);
	});

	it("returns exit code 2 when --env-file specifies a non-existent file", async () => {
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
		);

		const exitCode = await useCase.execute({
			schema: envPath,
			envFiles: ["./missing.env"],
			cwd: tempDir,
		});
		expect(exitCode).toBe(2);
	});

	it("returns exit code 2 when schema file does not call arkenv()", async () => {
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(envPath, "export const foo = 123;\n");

		const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
		expect(exitCode).toBe(2);
		expect(
			memoryReporter.logs.some(
				(l) =>
					l.type === "error" &&
					l.message.includes("No arkenv() schema definition was found"),
			),
		).toBe(true);
	});

	it("discovers schema file from package.json arkenv config", async () => {
		const schemaDir = path.join(tempDir, "config");
		await fs.mkdir(schemaDir);
		const envPath = path.join(schemaDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
		);
		await fs.writeFile(
			path.join(tempDir, "package.json"),
			JSON.stringify({ name: "app", arkenv: { schema: "./config/env.ts" } }),
		);

		const originalEnv = { ...process.env };
		process.env.PORT = "3000";

		try {
			const exitCode = await useCase.execute({ cwd: tempDir });
			expect(exitCode).toBe(0);
		} finally {
			process.env = originalEnv;
		}
	});

	it("returns exit code 0 when environment variables are valid", async () => {
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
		);

		const originalEnv = { ...process.env };
		process.env.PORT = "3000";

		try {
			const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
			expect(exitCode).toBe(0);
			expect(
				memoryReporter.logs.some(
					(l) =>
						l.type === "success" &&
						l.message.includes("your environment matches the schema"),
				),
			).toBe(true);
		} finally {
			process.env = originalEnv;
		}
	});

	it("loads and merges multiple --env-file parameters correctly", async () => {
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ HOST: "string", PORT: "number" });\n`,
		);

		const envFile1 = path.join(tempDir, ".env.base");
		const envFile2 = path.join(tempDir, ".env.override");
		await fs.writeFile(envFile1, "HOST=localhost\nPORT=3000\n");
		await fs.writeFile(envFile2, "PORT=8080\n");

		const originalEnv = { ...process.env };
		delete process.env.HOST;
		delete process.env.PORT;

		try {
			const exitCode = await useCase.execute({
				schema: envPath,
				envFiles: [envFile1, envFile2],
				cwd: tempDir,
			});
			expect(exitCode).toBe(0);
		} finally {
			process.env = originalEnv;
		}
	});

	it("returns exit code 4 with diagnostics and nextActions when validation fails", async () => {
		(logger as any).options.isJson = true;
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ DATABASE_URL: "string", PORT: "number" });\n`,
		);

		const originalEnv = { ...process.env };
		delete process.env.DATABASE_URL;
		process.env.PORT = "invalid-number";

		try {
			const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
			expect(exitCode).toBe(4);

			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportCompleted",
			);
			expect(reports).toHaveLength(1);
			const envelope = reports[0].data as any;
			expect(envelope.ok).toBe(true);
			expect(envelope.commandId).toBe("check");
			expect(envelope.exitCode).toBe(4);
			expect(envelope.diagnostics).toHaveLength(2);

			const missingDiag = envelope.diagnostics.find(
				(d: any) => d.meta.key === "DATABASE_URL",
			);
			expect(missingDiag).toMatchObject({
				code: "ENV.MISSING_VARIABLE",
				severity: "error",
				meta: {
					key: "DATABASE_URL",
					received: "missing",
				},
				nextActions: [
					{
						kind: "edit-file",
						label: "Set DATABASE_URL in .env",
						where: { path: ".env" },
					},
				],
			});

			const invalidDiag = envelope.diagnostics.find(
				(d: any) => d.meta.key === "PORT",
			);
			expect(invalidDiag).toMatchObject({
				code: "ENV.INVALID_VALUE",
				severity: "error",
				meta: {
					key: "PORT",
					received: "invalid-number",
				},
				nextActions: [
					{
						kind: "edit-file",
						label: "Set PORT in .env",
						where: { path: ".env" },
					},
				],
			});
		} finally {
			process.env = originalEnv;
		}
	});

	it("strictly redacts sensitive variable values in diagnostics meta and summary", async () => {
		(logger as any).options.isJson = true;
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ API_SECRET_TOKEN: "number" });\n`,
		);

		const originalEnv = { ...process.env };
		process.env.API_SECRET_TOKEN = "super-secret-token-value";

		try {
			const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
			expect(exitCode).toBe(4);

			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportCompleted",
			);
			const envelope = reports[0].data as any;
			const diag = envelope.diagnostics[0];

			expect(diag.meta.received).toBe("[REDACTED]");
			expect(diag.summary).toContain("(was [REDACTED])");
			expect(JSON.stringify(envelope)).not.toContain(
				"super-secret-token-value",
			);
		} finally {
			process.env = originalEnv;
		}
	});

	it("strictly redacts sensitive values containing closing parentheses", async () => {
		(logger as any).options.isJson = true;
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ DATABASE_URL: "number" });\n`,
		);

		const originalEnv = { ...process.env };
		process.env.DATABASE_URL = "postgres://user:p)ass@localhost:5432/db";

		try {
			const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
			expect(exitCode).toBe(4);

			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportCompleted",
			);
			const envelope = reports[0].data as any;
			const diag = envelope.diagnostics[0];

			expect(diag.meta.received).toBe("[REDACTED]");
			expect(diag.summary).toBe(
				"DATABASE_URL must be a number (was [REDACTED])",
			);
			expect(JSON.stringify(envelope)).not.toContain("p)ass");
		} finally {
			process.env = originalEnv;
		}
	});

	it("suggests .env.local for nextActions when Next.js framework is detected", async () => {
		(logger as any).options.isJson = true;
		await fs.writeFile(
			path.join(tempDir, "package.json"),
			JSON.stringify({
				name: "my-next-app",
				dependencies: { next: "15.0.0" },
			}),
		);
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ API_KEY: "string" });\n`,
		);

		const originalEnv = { ...process.env };
		delete process.env.API_KEY;

		try {
			const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
			expect(exitCode).toBe(4);

			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportCompleted",
			);
			const envelope = reports[0].data as any;
			expect(envelope.nextActions[0].where.path).toBe(".env.local");
			expect(envelope.nextActions[0].meta.targetFile).toBe(".env.local");
		} finally {
			process.env = originalEnv;
		}
	});

	it("returns exit code 1 when an unexpected runtime crash occurs during evaluation", async () => {
		(logger as any).options.isJson = true;
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(
			envPath,
			`import { arkenv } from "@arkenv/core";\nimport { isCapturingSchema } from "@repo/utils";\nexport const env = arkenv({ PORT: "number" });\nif (!isCapturingSchema()) { throw new Error("Unexpected native failure"); }\n`,
		);

		const originalEnv = { ...process.env };
		process.env.PORT = "3000";

		try {
			const exitCode = await useCase.execute({ schema: envPath, cwd: tempDir });
			expect(exitCode).toBe(1);

			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportErrored",
			);
			expect(reports).toHaveLength(1);
			expect(reports[0].data).toMatchObject({
				ok: false,
				commandId: "check",
				error: {
					code: "CLI.INTERNAL_ERROR",
					severity: "error",
					summary: expect.stringContaining("Unexpected native failure"),
				},
			});
		} finally {
			process.env = originalEnv;
		}
	});

	describe("--verify-example", () => {
		it("returns exit code 0 when .env.example contains all declared schema keys", async () => {
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number", DATABASE_URL: "string" });\n`,
			);
			await fs.writeFile(
				path.join(tempDir, ".env.example"),
				"PORT=3000\nDATABASE_URL=postgres://localhost:5432/db\n",
			);

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: true,
				cwd: tempDir,
			});

			expect(exitCode).toBe(0);
			expect(
				memoryReporter.logs.some(
					(l) =>
						l.type === "success" &&
						l.message.includes(".env.example matches the schema"),
				),
			).toBe(true);
		});

		it("returns exit code 4 and lists missing keys when .env.example is missing declared keys", async () => {
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number", DATABASE_URL: "string", REDIS_URL: "string" });\n`,
			);
			await fs.writeFile(path.join(tempDir, ".env.example"), "PORT=3000\n");

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: true,
				cwd: tempDir,
			});

			expect(exitCode).toBe(4);
			const errorLog = memoryReporter.logs.find((l) => l.type === "error");
			expect(errorLog).toBeDefined();
			expect(errorLog?.message).toContain("Missing 2 keys in .env.example");
			expect(errorLog?.message).toContain("DATABASE_URL");
			expect(errorLog?.message).toContain("REDIS_URL");
			expect(errorLog?.message).toContain(
				"Please add the missing keys to .env.example.",
			);
		});

		it("emits structured diagnostics in JSON mode when missing keys are found", async () => {
			(logger as any).options.isJson = true;
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ API_KEY: "string" });\n`,
			);
			await fs.writeFile(
				path.join(tempDir, ".env.example"),
				"# Empty example\n",
			);

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: true,
				cwd: tempDir,
			});

			expect(exitCode).toBe(4);
			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportCompleted",
			);
			expect(reports).toHaveLength(1);
			const envelope = reports[0].data as any;
			expect(envelope.ok).toBe(true);
			expect(envelope.commandId).toBe("check");
			expect(envelope.exitCode).toBe(4);
			expect(envelope.result.keys).toEqual({ declared: 1, missing: 1 });
			expect(envelope.diagnostics).toHaveLength(1);
			expect(envelope.diagnostics[0]).toMatchObject({
				code: "ENV.MISSING_VARIABLE",
				severity: "error",
				summary: "API_KEY is declared in schema but missing in .env.example",
				where: { path: ".env.example" },
				meta: { key: "API_KEY", targetFile: ".env.example" },
				nextActions: [
					{
						kind: "edit-file",
						label: "Add API_KEY to .env.example",
						where: { path: ".env.example" },
					},
				],
			});
		});

		it("emits clean completed envelope in JSON mode when .env.example is complete", async () => {
			(logger as any).options.isJson = true;
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
			);
			await fs.writeFile(path.join(tempDir, ".env.example"), "PORT=3000\n");

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: true,
				cwd: tempDir,
			});

			expect(exitCode).toBe(0);
			const reports = memoryReporter.logs.filter(
				(l) => l.type === "reportCompleted",
			);
			expect(reports).toHaveLength(1);
			const envelope = reports[0].data as any;
			expect(envelope.ok).toBe(true);
			expect(envelope.exitCode).toBe(0);
			expect(envelope.result.keys).toEqual({ declared: 1, missing: 0 });
			expect(envelope.diagnostics).toEqual([]);
		});

		it("supports custom example file path string in --verify-example <path>", async () => {
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ HOST: "string" });\n`,
			);
			const customPath = path.join(tempDir, ".env.example.custom");
			await fs.writeFile(customPath, "HOST=localhost\n");

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: ".env.example.custom",
				cwd: tempDir,
			});

			expect(exitCode).toBe(0);
			expect(
				memoryReporter.logs.some(
					(l) =>
						l.type === "success" &&
						l.message.includes(".env.example.custom matches the schema"),
				),
			).toBe(true);
		});

		it("gracefully treats a non-existent .env.example as missing all declared keys", async () => {
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ SECRET_A: "string", SECRET_B: "string" });\n`,
			);

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: true,
				cwd: tempDir,
			});

			expect(exitCode).toBe(4);
			const errorLog = memoryReporter.logs.find((l) => l.type === "error");
			expect(errorLog?.message).toContain("Missing 2 keys in .env.example");
			expect(errorLog?.message).toContain("SECRET_A");
			expect(errorLog?.message).toContain("SECRET_B");
		});

		it("succeeds when schema has no keys (arkenv({}))", async () => {
			const envPath = path.join(tempDir, "env.ts");
			await fs.writeFile(
				envPath,
				`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({});\n`,
			);

			const exitCode = await useCase.execute({
				schema: envPath,
				verifyExample: true,
				cwd: tempDir,
			});

			expect(exitCode).toBe(0);
		});
	});
});
