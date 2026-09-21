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

	it("ignores leftover package.json arkenv pointers (no scanner config read)", async () => {
		const workspace = createWorkspace([
			"/project/config/env.ts",
			"/project/env.ts",
		]);
		const scanner = createScanner();
		// Intentionally no readArkenvConfig — port no longer exposes it.
		expect(
			"readArkenvConfig" in scanner ? scanner.readArkenvConfig : undefined,
		).toBeUndefined();

		const resolved = await resolveSchemaPath(cwd, workspace, scanner);

		expect(resolved).toBe(path.resolve(cwd, "env.ts"));
	});
});
