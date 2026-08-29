import { ArkEnvError } from "@arkenv/core";
import { describe, expect, it } from "vitest";

import arkenvStandard, { arkenv as namedArkenvStandard } from "./standard";

// Mock Standard Schema validator
const mockSchema = <TOutput>(outputValue: TOutput) => ({
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		types: {} as { input: unknown; output: TOutput },
		validate: (value: unknown) => ({
			value: value === undefined ? outputValue : value,
		}),
	},
});

describe("Next.js Standard Mode Flat Layout", () => {
	it("exports arkenv as both named and default", () => {
		expect(arkenvStandard).toBe(namedArkenvStandard);
	});

	it("correctly handles flat layout and splits keys by prefix / options at runtime", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";
		(
			globalThis as { __arkenv_force_server__?: boolean }
		).__arkenv_force_server__ = true;

		try {
			const env = namedArkenvStandard(
				{
					DATABASE_URL: mockSchema(""),
					NEXT_PUBLIC_API_URL: mockSchema(""),
					NODE_ENV: mockSchema("test"),
					CUSTOM_VAR: mockSchema(""),
				},
				{
					exposeToClient: ["CUSTOM_VAR"],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						CUSTOM_VAR: "custom_val",
					},
				},
			);

			expect((env as any).DATABASE_URL).toBe("postgres://localhost:5432/db");
			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");
			expect(env.CUSTOM_VAR).toBe("custom_val");
		} finally {
			delete (globalThis as { __arkenv_force_server__?: boolean })
				.__arkenv_force_server__;
			delete process.env.DATABASE_URL;
		}
	});

	it("prevents accessing server-only variables on the client", () => {
		const origWindow = globalThis.window;
		(globalThis as any).window = {};

		try {
			const env = namedArkenvStandard(
				{
					DATABASE_URL: mockSchema("secret"),
					NEXT_PUBLIC_API_URL: mockSchema("https://api.example.com"),
				},
				{
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
					},
				},
			);

			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");

			try {
				(env as any).DATABASE_URL;
				expect.fail("Expected boundary access error");
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect(error).not.toBeInstanceOf(ArkEnvError);
				expect((error as Error).message).toContain("DATABASE_URL");
			}
		} finally {
			(globalThis as any).window = origWindow;
		}
	});
});
