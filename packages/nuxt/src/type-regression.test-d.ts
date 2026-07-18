import type { NuxtConfig, NuxtOptions } from "@nuxt/schema";
import { describe, expectTypeOf, it } from "vitest";
import type { ArkEnvConfigOptions } from "./config";
import { arkenv } from "./index";
import type { ModuleOptions } from "./module";
import arkenvStandard from "./standard";

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
		const env = arkenv({
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
		const env = arkenv({
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
		arkenv({
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
		// @ts-expect-error invalid ArkType schema strings in nested layout
		arkenv({
			server: {
				DATABASE_URL: "not-a-valid-type",
				PORT: "not-a-valid-type",
			},
			client: {
				NUXT_PUBLIC_API_URL: "not-a-valid-type",
			},
			shared: {
				NODE_ENV: "not-a-valid-type",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("enforces NUXT_PUBLIC_ client keys", () => {
		arkenv({
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

	it("correctly types flat layout environment variables", () => {
		const env = arkenv(
			{
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "'development' | 'production' | 'test' = 'development'",
				CUSTOM_VAR: "string",
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

		expectTypeOf(env.DATABASE_URL).toBeString();
		expectTypeOf(env.NUXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.NODE_ENV).toBeString();
		expectTypeOf(env.CUSTOM_VAR).toBeString();
	});

	it("correctly types Standard Mode Flat Mode environment variables and filters them on client", () => {
		const env = arkenvStandard(
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

declare module "#arkenv/client-env" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires an interface
	interface ClientEnv {
		NUXT_PUBLIC_API_URL: string;
		NODE_ENV: string;
	}
}

describe("@arkenv/nuxt server auto-extend types", () => {
	it("includes auto-extended client keys when extends is omitted", async () => {
		const { arkenv: serverArkenv } = await import("./server");
		const env = serverArkenv({
			DATABASE_URL: "string",
		});

		expectTypeOf(env.DATABASE_URL).toBeString();
		expectTypeOf(env.NUXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.NODE_ENV).toBeString();
	});

	it("keeps explicit extends override types", async () => {
		const { arkenv: serverArkenv } = await import("./server");
		const clientEnv = {
			NUXT_PUBLIC_API_URL: "https://api.example.com",
			CUSTOM_CLIENT: "value",
		};

		const env = serverArkenv(
			{ DATABASE_URL: "string" },
			{ extends: [clientEnv] },
		);

		expectTypeOf(env.DATABASE_URL).toBeString();
		expectTypeOf(env.NUXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.CUSTOM_CLIENT).toBeString();
	});
});

describe("@arkenv/nuxt module options augmentation", () => {
	it("aliases ModuleOptions to the documented ArkEnvConfigOptions", () => {
		expectTypeOf<ModuleOptions>().toEqualTypeOf<ArkEnvConfigOptions>();
	});

	it("types the arkenv config key on NuxtConfig and NuxtOptions", () => {
		expectTypeOf<NuxtConfig["arkenv"]>().toEqualTypeOf<
			ModuleOptions | undefined
		>();
		expectTypeOf<NuxtOptions["arkenv"]>().toEqualTypeOf<
			ModuleOptions | undefined
		>();
	});

	it("accepts known arkenv options in a nuxt config", () => {
		const config = {
			arkenv: {
				schemaPath: "src/env.ts",
				layout: "flat",
				validate: true,
			},
		} satisfies NuxtConfig;

		expectTypeOf(config.arkenv).toMatchTypeOf<ModuleOptions>();
	});

	it("rejects unknown keys in the arkenv config block", () => {
		const config: NuxtConfig = {
			arkenv: {
				// @ts-expect-error unknown option is not part of ModuleOptions
				unknownOption: true,
			},
		};

		expectTypeOf(config.arkenv).toEqualTypeOf<ModuleOptions | undefined>();
	});
});
