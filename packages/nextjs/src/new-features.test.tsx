import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
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
				client: { NEXT_PUBLIC_VAL: "string" }
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

describe("legacy nested layout deprecation warning", () => {
	it("should warn on legacy nested layout structure in development mode", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";

		try {
			// Call legacy signature
			arkenv({
				client: {
					NEXT_PUBLIC_VAL: "string",
				},
				runtimeEnv: {
					NEXT_PUBLIC_VAL: "hello",
				},
			});

			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0][0]).toContain(
				"Deprecated: The nested layout structure",
			);

			// Calling it again should not warn (one-time warn)
			arkenv({
				client: {
					NEXT_PUBLIC_VAL: "string",
				},
				runtimeEnv: {
					NEXT_PUBLIC_VAL: "hello",
				},
			});
			expect(warnSpy).toHaveBeenCalledTimes(1);
		} finally {
			process.env.NODE_ENV = originalNodeEnv;
			warnSpy.mockRestore();
		}
	});
});
