import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setupArkEnv } from "./config";
import { arkenv } from "./index";

describe("setupArkEnv non-wrapping API", () => {
	const tempDir = path.join(__dirname, "__temp_new_features__");
	const schemaPath = path.join(tempDir, "env.ts");

	afterEach(() => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should run code generation without wrapping a configuration object", () => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				NEXT_PUBLIC_VAL: "string",
			});
			`,
			"utf-8",
		);

		setupArkEnv({ schemaPath, validate: false });

		const genPath = path.join(tempDir, ".arkenv", "env.gen.ts");
		expect(fs.existsSync(genPath)).toBe(true);

		const generatedContent = fs.readFileSync(genPath, "utf-8");
		expect(generatedContent).toContain(
			"NEXT_PUBLIC_VAL: process.env.NEXT_PUBLIC_VAL,",
		);
		expect(generatedContent).not.toContain("__arkenv_env__");
	});
});

describe("removed nested bag API", () => {
	it("should throw a migration error for nested bag callers", () => {
		expect(() =>
			arkenv({
				client: {
					NEXT_PUBLIC_VAL: "string",
				},
				runtimeEnv: {
					NEXT_PUBLIC_VAL: "hello",
				},
			} as never),
		).toThrow(/nested arkenv\(\{ server, client, shared/);
	});
});
