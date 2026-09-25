import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { ProjectScannerPort, WorkspacePort } from "@/shared/ports";
import { resolveSchemaPath } from "./resolve-schema-path";

describe("resolveSchemaPath", () => {
	const cwd = "/project";

	function createWorkspace(existing: string[]): WorkspacePort {
		const set = new Set(existing.map((p) => path.resolve(p)));
		return {
			exists: vi.fn(async (filePath: string) =>
				set.has(path.resolve(filePath)),
			),
		} as unknown as WorkspacePort;
	}

	function createScanner(suggested: string | null = null): ProjectScannerPort {
		return {
			suggestDefaultEnvPath: vi.fn().mockResolvedValue(suggested),
		} as unknown as ProjectScannerPort;
	}

	it("returns an explicit --schema path when the file exists", async () => {
		const workspace = createWorkspace(["/project/config/env.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(
			cwd,
			workspace,
			scanner,
			"./config/env.ts",
		);

		expect(resolved).toBe(path.resolve(cwd, "./config/env.ts"));
		expect(scanner.suggestDefaultEnvPath).not.toHaveBeenCalled();
	});

	it("discovers a convention path without reading package.json", async () => {
		const workspace = createWorkspace(["/project/src/env.ts"]);
		const scanner = createScanner("./src/env.ts");

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBe(path.resolve(cwd, "src/env.ts"));
	});

	it("prefers convention env.ts over an off-convention sibling", async () => {
		const workspace = createWorkspace([
			"/project/config/env.ts",
			"/project/env.ts",
		]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		// Off-convention paths only win via --schema; leftover package.json
		// pointers are no longer consulted.
		expect(resolved).toBe(path.resolve(cwd, "env.ts"));
	});

	it("does not auto-discover leftover env/server.ts", async () => {
		const workspace = createWorkspace(["/project/env/server.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBeUndefined();
	});

	it("does not auto-discover leftover src/env/server.ts", async () => {
		const workspace = createWorkspace(["/project/src/env/server.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBeUndefined();
	});

	it("prefers flat env.ts when a leftover server-layout file also exists", async () => {
		const workspace = createWorkspace([
			"/project/env/server.ts",
			"/project/env.ts",
		]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBe(path.resolve(cwd, "env.ts"));
	});

	it("does not convention-discover JavaScript schema paths", async () => {
		for (const leftover of [
			"/project/env.js",
			"/project/src/env.js",
			"/project/env.mjs",
			"/project/src/env.mjs",
		]) {
			const workspace = createWorkspace([leftover]);
			const scanner = createScanner();

			const resolved = await resolveSchemaPath(cwd, workspace, scanner);

			expect(resolved, leftover).toBeUndefined();
		}
	});

	it("resolves an explicit --schema .js path", async () => {
		const workspace = createWorkspace(["/project/env.js"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(
			cwd,
			workspace,
			scanner,
			"./env.js",
		);

		expect(resolved).toBe(path.resolve(cwd, "./env.js"));
		expect(scanner.suggestDefaultEnvPath).not.toHaveBeenCalled();
	});

	it("resolves an explicit --schema .mjs path", async () => {
		const workspace = createWorkspace(["/project/src/env.mjs"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(
			cwd,
			workspace,
			scanner,
			"./src/env.mjs",
		);

		expect(resolved).toBe(path.resolve(cwd, "./src/env.mjs"));
		expect(scanner.suggestDefaultEnvPath).not.toHaveBeenCalled();
	});

	it("still resolves an explicit --schema path to a server-layout file", async () => {
		const workspace = createWorkspace(["/project/env/server.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(
			cwd,
			workspace,
			scanner,
			"./env/server.ts",
		);

		expect(resolved).toBe(path.resolve(cwd, "./env/server.ts"));
		expect(scanner.suggestDefaultEnvPath).not.toHaveBeenCalled();
	});
});
