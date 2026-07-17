import type { NuxtConfig, NuxtOptions } from "@nuxt/schema";
import { describe, expectTypeOf, it } from "vitest";
import type { ArkEnvConfigOptions } from "./config";
import { createEnv } from "./index";
import type { ModuleOptions } from "./module";

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
		// @ts-expect-error invalid ArkType schema string
		createEnv({
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

	it("correctly types Flat Mode environment variables", () => {
		const env = createEnv(
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
