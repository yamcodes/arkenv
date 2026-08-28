import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JitiSchemaLoaderAdapter } from "@/adapters/jiti-schema-loader";
import { Logger } from "@/adapters/logger.adapter";
import { NodeProjectScannerAdapter } from "@/adapters/node-project-scanner";
import { NodeWorkspace } from "@/adapters/node-workspace";
import { MemoryReporter } from "@/adapters/reporters/memory.reporter";
import { ExampleUseCase } from "@/cli/commands/example";

describe("ExampleUseCase", () => {
	let tempDir: string;
	let memoryReporter: MemoryReporter;
	let logger: Logger;
	let workspace: NodeWorkspace;
	let scanner: NodeProjectScannerAdapter;
	let schemaLoader: JitiSchemaLoaderAdapter;
	let useCase: ExampleUseCase;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arkenv-example-test-"));
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
				arkenv: path.resolve(__dirname, "../../../../core/src/index.ts"),
			},
		});
		useCase = new ExampleUseCase(logger, workspace, scanner, schemaLoader);
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
	});

	async function writeSchema(source: string): Promise<string> {
		const envPath = path.join(tempDir, "env.ts");
		await fs.writeFile(envPath, source);
		return envPath;
	}

	it("creates .env.example with declared keys in schema order", async () => {
		await writeSchema(
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ DATABASE_URL: "string", PORT: "number", CI: "boolean" });\n`,
		);

		const exitCode = await useCase.execute({ cwd: tempDir });
		expect(exitCode).toBe(0);
		expect(await fs.readFile(path.join(tempDir, ".env.example"), "utf8")).toBe(
			"DATABASE_URL=\nPORT=\nCI=\n",
		);
		expect(
			memoryReporter.logs.some(
				(l) => l.type === "success" && l.message.includes("Created"),
			),
		).toBe(true);
	});

	it("produces no file diff when re-run without schema changes", async () => {
		await writeSchema(
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
		);

		expect(await useCase.execute({ cwd: tempDir })).toBe(0);
		const first = await fs.readFile(path.join(tempDir, ".env.example"), "utf8");
		expect(await useCase.execute({ cwd: tempDir })).toBe(0);
		expect(await fs.readFile(path.join(tempDir, ".env.example"), "utf8")).toBe(
			first,
		);
		expect(
			memoryReporter.logs.some(
				(l) => l.type === "success" && l.message.includes("already matches"),
			),
		).toBe(true);
	});

	it("appends new keys, removes stale keys, and preserves surviving comments and values", async () => {
		await writeSchema(
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ DATABASE_URL: "string", PORT: "number", NODE_ENV: "string" });\n`,
		);
		await fs.writeFile(
			path.join(tempDir, ".env.example"),
			"# Database\nDATABASE_URL=postgres://localhost/app\n\n# Port\nPORT=3000\nSTALE=1\n",
		);

		expect(await useCase.execute({ cwd: tempDir })).toBe(0);
		expect(await fs.readFile(path.join(tempDir, ".env.example"), "utf8")).toBe(
			"# Database\nDATABASE_URL=postgres://localhost/app\n\n# Port\nPORT=3000\nNODE_ENV=\n",
		);
	});

	it("returns exit code 2 and leaves .env.example untouched when the loader fails", async () => {
		await writeSchema("export const foo = 123;\n");
		const examplePath = path.join(tempDir, ".env.example");
		await fs.writeFile(examplePath, "KEEP=1\n");

		const exitCode = await useCase.execute({ cwd: tempDir });
		expect(exitCode).toBe(2);
		expect(await fs.readFile(examplePath, "utf8")).toBe("KEEP=1\n");
		expect(memoryReporter.logs.some((l) => l.type === "error")).toBe(true);
	});

	it("emits created/updated/unchanged status in JSON mode", async () => {
		(logger as any).options.isJson = true;
		await writeSchema(
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
		);

		expect(await useCase.execute({ cwd: tempDir })).toBe(0);
		const created = memoryReporter.logs.filter(
			(l) => l.type === "reportCompleted",
		);
		expect(created).toHaveLength(1);
		expect(created[0].data).toMatchObject({
			ok: true,
			commandId: "example",
			result: {
				status: "created",
				schema: { path: "env.ts" },
				file: { path: ".env.example" },
				keys: { declared: 1 },
			},
			exitCode: 0,
		});

		expect(await useCase.execute({ cwd: tempDir })).toBe(0);
		const reports = memoryReporter.logs.filter(
			(l) => l.type === "reportCompleted",
		);
		expect(reports[1].data).toMatchObject({
			result: { status: "unchanged", keys: { declared: 1 } },
		});
	});

	it("does not write JSON when embedded in another command", async () => {
		(logger as any).options.isJson = true;
		await writeSchema(
			`import { arkenv } from "@arkenv/core";\nexport const env = arkenv({ PORT: "number" });\n`,
		);

		expect(await useCase.execute({ cwd: tempDir, embedded: true })).toBe(0);
		expect(
			memoryReporter.logs.filter((l) => l.type === "reportCompleted"),
		).toHaveLength(0);
		expect(await fs.readFile(path.join(tempDir, ".env.example"), "utf8")).toBe(
			"PORT=\n",
		);
	});
});
