import { describe, expectTypeOf, it } from "vitest";
import { createEnv } from "./index";
import { createEnv as createEnvStandard } from "./standard";

const createMockStandardSchema = <TOutput>(outputValue: TOutput) => ({
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		types: {} as { input: unknown; output: TOutput },
		validate: (_value: unknown) => ({ value: outputValue }),
	},
});

describe("@arkenv/nuxt type regression", () => {
	it("infers client variables as their validated type", () => {
		const env = createEnv({
			server: {
				DATABASE_URL: "string",
			},
			client: {
				NUXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		expectTypeOf(env.NUXT_PUBLIC_API_URL).toBeString();
	});

	it("infers docs-style imports as string values", () => {
		const env = createEnv({
			client: {
				NUXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const apiUrl = env.NUXT_PUBLIC_API_URL;

		expectTypeOf(apiUrl).toBeString();
	});

	it("validates ArkType schema strings across schema sections", () => {
		createEnv({
			server: {
				DATABASE_URL: "string.url",
				PORT: "number.port = 3000",
			},
			client: {
				NUXT_PUBLIC_API_URL: "string.url",
			},
			shared: {
				NODE_ENV: "'development' | 'production' | 'test' = 'development'",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("rejects invalid ArkType schema strings across schema sections", () => {
		createEnv({
			server: {
				// @ts-expect-error invalid ArkType schema string
				DATABASE_URL: "not-a-valid-type",
				// @ts-expect-error invalid ArkType schema string
				PORT: "not-a-valid-type",
			},
			client: {
				// @ts-expect-error invalid ArkType schema string
				NUXT_PUBLIC_API_URL: "not-a-valid-type",
			},
			shared: {
				// @ts-expect-error invalid ArkType schema string
				NODE_ENV: "not-a-valid-type",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("enforces NUXT_PUBLIC_ client keys", () => {
		createEnv({
			client: {
				NUXT_PUBLIC_API_URL: "string.url",
				// @ts-expect-error client variables must be prefixed with NUXT_PUBLIC_
				API_URL: "string.url",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				API_URL: "https://api.example.com",
			},
		});
	});

	it("correctly types Standard Mode Flat Mode environment variables and filters them on client", () => {
		const env = createEnvStandard(
			{
				DATABASE_URL: createMockStandardSchema(""),
				NUXT_PUBLIC_API_URL: createMockStandardSchema(""),
				NODE_ENV: createMockStandardSchema("development"),
				CUSTOM_VAR: createMockStandardSchema(""),
			},
			{
				exposeToClient: ["CUSTOM_VAR"],
				runtimeEnv: {
					NUXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "development",
					CUSTOM_VAR: "custom_val",
				},
			},
		);

		expectTypeOf(env.NUXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.NODE_ENV).toBeString();
		expectTypeOf(env.CUSTOM_VAR).toBeString();

		// @ts-expect-error server-only variable is omitted/never on the client
		env.DATABASE_URL;
	});
});
