import { afterEach, describe, expect, it } from "vitest";
import { ENV_KEYS, EXTENDED_ENV } from "./arkenv-internal";
import { arkenv as serverArkenv } from "./server";
import { arkenv as standardServerArkenv } from "./standard/server";

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

function createMockClientEnv(values: Record<string, unknown>) {
	const keys = new Set(Object.keys(values));
	return new Proxy(values, {
		get(target, prop) {
			if (prop === EXTENDED_ENV) return target;
			if (prop === ENV_KEYS) return keys;
			return Reflect.get(target, prop);
		},
	});
}

describe("server auto-extend in strict layout", () => {
	afterEach(() => {
		delete (globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean })
			.__ARKENV_STRICT_LAYOUT__;
		delete (globalThis as { __ARKENV_CLIENT_ENV__?: unknown })
			.__ARKENV_CLIENT_ENV__;
		delete process.env.DATABASE_URL;
		delete process.env.NUXT_PUBLIC_API_URL;
		delete process.env.NODE_ENV;
	});

	it("auto-extends from injected client env when extends is omitted", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(globalThis as { __ARKENV_CLIENT_ENV__?: unknown }).__ARKENV_CLIENT_ENV__ =
			createMockClientEnv({
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			});
		process.env.DATABASE_URL = "postgres://localhost/db";

		const env = serverArkenv({
			DATABASE_URL: "string",
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost/db");
		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("development");
	});

	it("does not auto-extend without the strict layout flag", () => {
		(globalThis as { __ARKENV_CLIENT_ENV__?: unknown }).__ARKENV_CLIENT_ENV__ =
			createMockClientEnv({
				NUXT_PUBLIC_API_URL: "https://api.example.com",
			});
		process.env.DATABASE_URL = "postgres://localhost/db";

		const env = serverArkenv({
			DATABASE_URL: "string",
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost/db");
		expect(
			() => (env as { NUXT_PUBLIC_API_URL?: string }).NUXT_PUBLIC_API_URL,
		).toThrow(/not defined in the schema/);
	});

	it("lets explicit extends override auto-extend", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(globalThis as { __ARKENV_CLIENT_ENV__?: unknown }).__ARKENV_CLIENT_ENV__ =
			createMockClientEnv({
				NUXT_PUBLIC_API_URL: "https://auto.example.com",
				NODE_ENV: "production",
			});
		process.env.DATABASE_URL = "postgres://localhost/db";

		const manualClient = createMockClientEnv({
			NUXT_PUBLIC_API_URL: "https://manual.example.com",
			NODE_ENV: "test",
		});

		const env = serverArkenv(
			{ DATABASE_URL: "string" },
			{ extends: [manualClient] },
		);

		expect(env.DATABASE_URL).toBe("postgres://localhost/db");
		expect(env.NUXT_PUBLIC_API_URL).toBe("https://manual.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("has parity auto-extend on @arkenv/nuxt/standard/server", () => {
		(
			globalThis as { __ARKENV_STRICT_LAYOUT__?: boolean }
		).__ARKENV_STRICT_LAYOUT__ = true;
		(globalThis as { __ARKENV_CLIENT_ENV__?: unknown }).__ARKENV_CLIENT_ENV__ =
			createMockClientEnv({
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			});
		process.env.DATABASE_URL = "postgres://localhost/db";

		const env = standardServerArkenv({
			DATABASE_URL: mockSchema(""),
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost/db");
		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("development");
	});
});
