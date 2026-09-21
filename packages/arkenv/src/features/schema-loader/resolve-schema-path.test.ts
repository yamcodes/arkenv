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

	it("does not auto-discover env/server.ts alone", async () => {
		const workspace = createWorkspace(["/project/env/server.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBeUndefined();
	});

	it("does not auto-discover src/env/server.ts alone", async () => {
		const workspace = createWorkspace(["/project/src/env/server.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBeUndefined();
	});

	it("still resolves flat env.ts when present", async () => {
		const workspace = createWorkspace(["/project/env.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBe(path.resolve(cwd, "env.ts"));
	});

	it("still resolves flat src/env.ts when present", async () => {
		const workspace = createWorkspace(["/project/src/env.ts"]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBe(path.resolve(cwd, "src/env.ts"));
	});

	it("resolves an explicit --schema pointing at env/server.ts", async () => {
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

	it("prefers flat env.ts over a leftover env/server.ts sibling", async () => {
		const workspace = createWorkspace([
			"/project/env/server.ts",
			"/project/env.ts",
		]);
		const scanner = createScanner();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBe(path.resolve(cwd, "env.ts"));
	});
});
