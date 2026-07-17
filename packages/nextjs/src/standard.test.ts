import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import arkenvStandard, { arkenv as namedArkenvStandard } from "./standard";
import { arkenv as clientArkenv } from "./standard/client";
import { arkenv as serverArkenv } from "./standard/server";
import { arkenv as sharedArkenv } from "./standard/shared";

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

	it("exports arkenv from all standard subpaths", () => {
		expect(clientArkenv).toBeDefined();
		expect(serverArkenv).toBeDefined();
		expect(sharedArkenv).toBeDefined();
	});

	it("correctly handles flat layout and splits keys by prefix / options at runtime", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";

		const env = serverArkenv(
			{
				DATABASE_URL: mockSchema(""),
				NEXT_PUBLIC_API_URL: mockSchema(""),
				NODE_ENV: mockSchema("test"),
				CUSTOM_VAR: mockSchema(""),
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "test",
					CUSTOM_VAR: "custom_val",
				},
			},
		);

		// On the server (by default isServer is true under test process.env check if isServer is true or mock)
		expect((env as any).DATABASE_URL).toBe("postgres://localhost:5432/db");
		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
		expect(env.CUSTOM_VAR).toBe("custom_val");

		delete process.env.DATABASE_URL;
	});

	it("prevents accessing server-only variables on the client", () => {
		// Mock client context
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

			expect(() => {
				(env as any).DATABASE_URL;
			}).toThrow(
				"ArkEnv Error: Attempted to access server environment variable 'DATABASE_URL' on the client",
			);
		} finally {
			(globalThis as any).window = origWindow;
		}
	});
});
