import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setupArkEnv } from "./config";
import { arkenv } from "./index";
import { ArkEnvScript } from "./script";

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

		const genPath = path.join(tempDir, "generated", "env.gen.ts");
		expect(fs.existsSync(genPath)).toBe(true);

		const generatedContent = fs.readFileSync(genPath, "utf-8");
		expect(generatedContent).toContain(
			'NEXT_PUBLIC_VAL: typeof window !== "undefined"',
		);
	});
});

describe("ArkEnvScript component", () => {
	it("should serialize and inject NEXT_PUBLIC_* variables from process.env", () => {
		const originalEnv = { ...process.env };
		process.env.NEXT_PUBLIC_TEST_VAR = "hello-world";
		process.env.SECRET_VAR = "secret";

		try {
			// Render component manually
			const element = ArkEnvScript() as any;
			const html = element.props.dangerouslySetInnerHTML.__html;

			expect(html).toContain("NEXT_PUBLIC_TEST_VAR");
			expect(html).toContain("hello-world");
			expect(html).not.toContain("SECRET_VAR");
		} finally {
			process.env = originalEnv;
		}
	});

	it("should merge and serialize NEXT_PUBLIC_* variables from env prop", () => {
		const element = ArkEnvScript({
			env: {
				NEXT_PUBLIC_PROP_VAR: "prop-value",
				SECRET_PROP_VAR: "secret-prop",
			},
		}) as any;
		const html = element.props.dangerouslySetInnerHTML.__html;

		expect(html).toContain("NEXT_PUBLIC_PROP_VAR");
		expect(html).toContain("prop-value");
		expect(html).not.toContain("SECRET_PROP_VAR");
	});
});

describe("dynamic client environment variable lookup", () => {
	afterEach(() => {
		delete (globalThis as any).__arkenv_env__;
	});

	it("should prioritize values from globalThis.__arkenv_env__ on the client side", () => {
		// Mock browser environment (typeof window !== "undefined")
		vi.stubGlobal("window", {});

		(globalThis as any).__arkenv_env__ = {
			NEXT_PUBLIC_DYNAMIC: "dynamic-override",
		};

		const env = arkenv({
			client: {
				NEXT_PUBLIC_DYNAMIC: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_DYNAMIC: "build-time-value",
			},
		});

		expect(env.NEXT_PUBLIC_DYNAMIC).toBe("dynamic-override");

		vi.unstubAllGlobals();
	});

	it("should fallback to runtimeEnv/process.env if globalThis.__arkenv_env__ is missing the variable", () => {
		vi.stubGlobal("window", {});

		(globalThis as any).__arkenv_env__ = {
			NEXT_PUBLIC_OTHER: "other-value",
		};

		const env = arkenv({
			client: {
				NEXT_PUBLIC_DYNAMIC: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_DYNAMIC: "build-time-value",
			},
		});

		expect(env.NEXT_PUBLIC_DYNAMIC).toBe("build-time-value");

		vi.unstubAllGlobals();
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
