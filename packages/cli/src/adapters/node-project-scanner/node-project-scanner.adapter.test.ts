import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeProjectScannerAdapter } from "./node-project-scanner.adapter";

describe("NodeProjectScannerAdapter", () => {
	let tempDir: string;
	let scanner: NodeProjectScannerAdapter;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "scanner-test-"));
		scanner = new NodeProjectScannerAdapter();
	});

	afterEach(async () => {
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	describe("env parsing", () => {
		it("should extract keys from a standard .env.example", async () => {
			const content = `
PORT=3000
DATABASE_URL=postgres://localhost:5432/db
# This is a comment
API_KEY=
      `;
			await fsp.writeFile(path.join(tempDir, ".env.example"), content);
			const result = await scanner.getEnvExampleKeys(tempDir);
			expect(result?.keys).toEqual(["PORT", "DATABASE_URL", "API_KEY"]);
			expect(result?.source).toBe(".env.example");
		});

		it("should fall back to scanning project files", async () => {
			await fsp.writeFile(
				path.join(tempDir, "index.ts"),
				`
				const port = process.env.PORT;
				const apiUrl = import.meta.env.VITE_API_URL;
				`,
			);

			const result = await scanner.getEnvExampleKeys(tempDir);
			expect(result?.keys).toEqual(["PORT", "VITE_API_URL"]);
			expect(result?.source).toBe("project");
		});
	});

	describe("checkTsConfig", () => {
		it("returns not_found when no tsconfig exists", async () => {
			const result = await scanner.checkTsConfig(tempDir);
			expect(result.status).toBe("not_found");
		});

		it("returns strict when tsconfig has strict: true", async () => {
			await fsp.writeFile(
				path.join(tempDir, "tsconfig.json"),
				JSON.stringify({ compilerOptions: { strict: true } }),
			);
			const result = await scanner.checkTsConfig(tempDir);
			expect(result.status).toBe("strict");
		});
	});

	describe("detectFramework", () => {
		it("defaults to node when no signals are found", async () => {
			const result = await scanner.detectFramework(tempDir);
			expect(result).toBe("node");
		});

		it("detects vite from vite.config.ts", async () => {
			await fsp.writeFile(path.join(tempDir, "vite.config.ts"), "");
			const result = await scanner.detectFramework(tempDir);
			expect(result).toBe("vite");
		});

		it("detects framework from tsconfig types", async () => {
			const tsConfig = {
				path: path.join(tempDir, "tsconfig.json"),
				compilerOptions: { types: ["vite/client"] },
			};
			const result = await scanner.detectFramework(tempDir, tsConfig);
			expect(result).toBe("vite");
		});
	});

	describe("detectBunFeatures", () => {
		it("detects serve and build features", async () => {
			await fsp.writeFile(
				path.join(tempDir, "server.ts"),
				'import { serve } from "bun"; serve({});',
			);
			await fsp.writeFile(
				path.join(tempDir, "build.ts"),
				"Bun.build({ entrypoints: [] });",
			);

			const result = await scanner.detectBunFeatures(tempDir);
			expect(result).toContain("serve");
			expect(result).toContain("build");
		});

		it("returns empty array when no bun features are used", async () => {
			await fsp.writeFile(
				path.join(tempDir, "index.ts"),
				"console.log('hello')",
			);
			const result = await scanner.detectBunFeatures(tempDir);
			expect(result).toEqual([]);
		});
	});

	describe("suggestDefaultEnvPath", () => {
		it("suggests path based on rootDir in tsconfig", async () => {
			const tsConfig = {
				path: path.join(tempDir, "tsconfig.json"),
				compilerOptions: { rootDir: path.join(tempDir, "lib") },
			};
			const result = await scanner.suggestDefaultEnvPath(tempDir, tsConfig);
			expect(result).toBe("./lib/env.ts");
		});

		it("suggests ./src/env.ts if src directory exists", async () => {
			await fsp.mkdir(path.join(tempDir, "src"));
			const result = await scanner.suggestDefaultEnvPath(tempDir, null);
			expect(result).toBe("./src/env.ts");
		});

		it("fallbacks to ./env.ts if no src exists", async () => {
			const result = await scanner.suggestDefaultEnvPath(tempDir, null);
			expect(result).toBe("./env.ts");
		});
	});
});
