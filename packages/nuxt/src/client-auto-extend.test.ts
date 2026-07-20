import { afterEach, describe, expect, it } from "vitest";
import { arkenv as clientArkenv } from "./client";
import { arkenv as standardClientArkenv } from "./standard/client";

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

describe("client auto-extend in strict layout", () => {
	afterEach(() => {
		delete (globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean })
			.__ARKENV_STRICT_LAYOUT__;
		delete (globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown })
			.__ARKENV_SHARED_SCHEMA__;
		delete process.env.NUXT_PUBLIC_API_URL;
		delete process.env.NODE_ENV;
	});

	it("auto-extends from injected shared schema when extends is omitted", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(
			globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown }
		).__ARKENV_SHARED_SCHEMA__ = {
			NODE_ENV: "'development' | 'production' | 'test' = 'development'",
		};
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "production";

		const env = clientArkenv({
			NUXT_PUBLIC_API_URL: "string",
		});

		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect((env as unknown as { NODE_ENV: string }).NODE_ENV).toBe(
			"production",
		);
	});

	it("does not auto-extend without the strict layout flag", () => {
		(
			globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown }
		).__ARKENV_SHARED_SCHEMA__ = {
			NODE_ENV: "string = 'development'",
		};
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "production";

		const env = clientArkenv({
			NUXT_PUBLIC_API_URL: "string",
		});

		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(() => (env as { NODE_ENV?: string }).NODE_ENV).toThrow(
			/not defined in the schema/,
		);
	});

	it("lets explicit extends override auto-extend", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(
			globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown }
		).__ARKENV_SHARED_SCHEMA__ = {
			NODE_ENV: "string = 'auto'",
		};
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "test";

		const env = clientArkenv(
			{ NUXT_PUBLIC_API_URL: "string" },
			{ extends: [{ NODE_ENV: "string = 'manual'" }] },
		);

		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("treats extends: [] as an opt-out of auto-extend", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(
			globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown }
		).__ARKENV_SHARED_SCHEMA__ = {
			NODE_ENV: "string = 'auto'",
		};
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "production";

		const env = clientArkenv(
			{ NUXT_PUBLIC_API_URL: "string" },
			{ extends: [] },
		);

		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(() => (env as { NODE_ENV?: string }).NODE_ENV).toThrow(
			/not defined in the schema/,
		);
	});

	it("treats property presence of extends as an opt-out", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(
			globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown }
		).__ARKENV_SHARED_SCHEMA__ = {
			NODE_ENV: "string = 'auto'",
		};
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";

		const env = clientArkenv(
			{ NUXT_PUBLIC_API_URL: "string" },
			{ extends: undefined },
		);

		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(() => (env as { NODE_ENV?: string }).NODE_ENV).toThrow(
			/not defined in the schema/,
		);
	});

	it("has parity auto-extend on @arkenv/nuxt/standard/client", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(
			globalThis as { __ARKENV_SHARED_SCHEMA__?: unknown }
		).__ARKENV_SHARED_SCHEMA__ = {
			NODE_ENV: mockSchema("development"),
		};
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "production";

		const env = standardClientArkenv({
			NUXT_PUBLIC_API_URL: mockSchema(""),
		});

		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect((env as unknown as { NODE_ENV: string }).NODE_ENV).toBe(
			"production",
		);
	});
});
