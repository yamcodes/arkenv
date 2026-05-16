import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseEnvExample, scanProjectEnvKeys } from "./env-parser";

describe("env-parser", () => {
	it("should extract keys from a standard .env.example", () => {
		const content = `
PORT=3000
DATABASE_URL=postgres://localhost:5432/db
# This is a comment
API_KEY=
      `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["PORT", "DATABASE_URL", "API_KEY"]);
	});

	it("should handle keys with underscores and numbers", () => {
		const content = `
MY_APP_V1_SECRET=foo
DB_2_URL=bar
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["MY_APP_V1_SECRET", "DB_2_URL"]);
	});

	it("should ignore comments and empty lines", () => {
		const content = `
# Header
KEY1=VAL1

# Another comment
KEY2=VAL2
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["KEY1", "KEY2"]);
	});

	it("should preserve lowercase keys", () => {
		const content = `
port=3000
database_url=foo
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["port", "database_url"]);
	});

	it("should return unique keys", () => {
		const content = `
PORT=3000
PORT=4000
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["PORT"]);
	});

	it("should ignore lines without equals sign", () => {
		const content = `
INVALID_LINE
KEY=VALUE
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["KEY"]);
	});

	it("should handle whitespace around equals", () => {
		const content = `
KEY1 = VALUE1
KEY2=VALUE2
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["KEY1", "KEY2"]);
	});

	describe("scanProjectEnvKeys", () => {
		let tempDir: string;

		beforeEach(async () => {
			tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "env-parser-test-"));
		});

		afterEach(async () => {
			await fsp.rm(tempDir, { recursive: true, force: true });
		});

		it("should detect process.env and import.meta.env usages", async () => {
			await fsp.writeFile(
				path.join(tempDir, "index.ts"),
				`
				const port = process.env.PORT;
				const apiUrl = import.meta.env.VITE_API_URL;
				`,
			);

			const keys = await scanProjectEnvKeys(tempDir);
			expect(keys).toEqual(["PORT", "VITE_API_URL"]);
		});

		it("should detect env variables used with alias imports", async () => {
			const envConfigPath = path.join(tempDir, "src", "env.ts");
			await fsp.mkdir(path.join(tempDir, "src"), { recursive: true });
			await fsp.writeFile(
				path.join(tempDir, "src", "main.ts"),
				`
				import { env } from "@/env";
				console.log(env.DATABASE_URL, env.API_KEY);
				`,
			);

			const tsConfig = {
				path: path.join(tempDir, "tsconfig.json"),
				compilerOptions: {
					baseUrl: tempDir,
					paths: {
						"@/*": ["./src/*"],
					},
				},
			};

			const keys = await scanProjectEnvKeys(tempDir, tsConfig, envConfigPath);
			expect(keys).toEqual(["DATABASE_URL", "API_KEY"]);
		});
	});
});
