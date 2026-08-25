import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadValidatedEnv } from "./load-validated-env";

describe("loadValidatedEnv", () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	it("loads named env export from schema module", () => {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-load-env-"));
		tempDirs.push(tmp);

		const schemaPath = path.join(tmp, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`export const env = { FOO: process.env.FOO ?? "default" };`,
		);

		const result = loadValidatedEnv(schemaPath, { FOO: "bar" });
		expect(result).toEqual({ FOO: "bar" });
		expect(process.env.FOO).toBeUndefined();
	});

	it("loads default env export from schema module", () => {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-load-env-def-"));
		tempDirs.push(tmp);

		const schemaPath = path.join(tmp, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`const env = { PORT: process.env.PORT ?? "3000" }; export default env;`,
		);

		const result = loadValidatedEnv(schemaPath, { PORT: "8080" });
		expect(result).toEqual({ PORT: "8080" });
	});

	it("throws if module does not export an env object", () => {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-load-env-err-"));
		tempDirs.push(tmp);

		const schemaPath = path.join(tmp, "env.ts");
		fs.writeFileSync(schemaPath, "export default 123;");

		expect(() => loadValidatedEnv(schemaPath, {})).toThrow(
			/must export an `env` object/,
		);
	});
});
