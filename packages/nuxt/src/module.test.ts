import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import module from "./module";

vi.mock("@nuxt/kit", () => {
	return {
		defineNuxtModule: (config: any) => {
			return {
				...config,
				setup: config.setup,
			};
		},
		createResolver: () => ({
			resolve: (p: string) => path.resolve(__dirname, p),
		}),
		addServerPlugin: vi.fn(),
		useLogger: () => {
			return {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				success: vi.fn(),
			};
		},
	};
});

/**
 * Invoke every Nuxt hook registered under `name` (module may register several).
 */
function runHooks(
	mockNuxt: { hook: { mock: { calls: unknown[][] } } },
	name: string,
	...args: unknown[]
) {
	for (const [hookName, handler] of mockNuxt.hook.mock.calls) {
		if (hookName === name && typeof handler === "function") {
			(handler as (...a: unknown[]) => void)(...args);
		}
	}
}

describe("Nuxt module integration", () => {
	it("should parse and register variables to nuxt.options.runtimeConfig", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-test");
		fs.mkdirSync(tempDir, { recursive: true });

		const schemaPath = path.join(tempDir, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				server: { DATABASE_URL: "string" },
				client: { NUXT_PUBLIC_API_URL: "string" },
				shared: { NODE_ENV: "string" }
			});
			`,
		);

		const mockNuxt: any = {
			options: {
				dev: false,
				rootDir: tempDir,
				runtimeConfig: {
					public: {},
				},
			},
			hook: vi.fn(),
		};

		try {
			await (module as any).setup(
				{
					schemaPath: "./env.ts",
					validate: false,
				},
				mockNuxt,
			);

			expect(mockNuxt.options.runtimeConfig.DATABASE_URL).toBeDefined();
			expect(
				mockNuxt.options.runtimeConfig.public.NUXT_PUBLIC_API_URL,
			).toBeDefined();
			expect(mockNuxt.options.runtimeConfig.public.NODE_ENV).toBeDefined();
			expect(mockNuxt.options.runtimeConfig.arkenvGate).toMatchObject({
				engine: "arktype",
			});
			expect(mockNuxt.options.runtimeConfig.arkenvGate.layout).toBeUndefined();

			expect(mockNuxt.hook).toHaveBeenCalledWith(
				"vite:extendConfig",
				expect.any(Function),
			);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should add schema path to nuxt.options.watch in dev mode", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-dev-test");
		fs.mkdirSync(tempDir, { recursive: true });

		const schemaPath = path.join(tempDir, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				server: { DATABASE_URL: "string" },
				client: { NUXT_PUBLIC_API_URL: "string" },
				shared: { NODE_ENV: "string" }
			});
			`,
		);

		const mockNuxt: any = {
			options: {
				dev: true,
				rootDir: tempDir,
				runtimeConfig: {
					public: {},
				},
			},
			hook: vi.fn(),
		};

		try {
			await (module as any).setup(
				{
					schemaPath: "./env.ts",
					validate: false,
				},
				mockNuxt,
			);

			expect(mockNuxt.options.watch).toContain(schemaPath);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should register flat layout keys to nuxt.options.runtimeConfig", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-flat-test");
		fs.mkdirSync(tempDir, { recursive: true });

		const schemaPath = path.join(tempDir, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`
			export const env = arkenv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string"
			});
			`,
		);

		const mockNuxt: any = {
			options: {
				dev: false,
				rootDir: tempDir,
				runtimeConfig: {
					public: {},
				},
			},
			hook: vi.fn(),
		};

		try {
			await (module as any).setup(
				{
					schemaPath: "./env.ts",
					validate: false,
				},
				mockNuxt,
			);

			expect(mockNuxt.options.runtimeConfig.DATABASE_URL).toBeDefined();
			expect(
				mockNuxt.options.runtimeConfig.public.NUXT_PUBLIC_API_URL,
			).toBeDefined();
			expect(mockNuxt.options.runtimeConfig.public.NODE_ENV).toBeDefined();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("registers #arkenv/server-boot aliases only (no client-env / shared-schema)", async () => {
		const tempDir = path.resolve(__dirname, "temp-simple-no-alias");
		fs.mkdirSync(tempDir, { recursive: true });

		try {
			fs.writeFileSync(
				path.join(tempDir, "env.ts"),
				`export const env = arkenv({ DATABASE_URL: "string" });`,
			);

			const mockNuxt: any = {
				options: {
					dev: false,
					rootDir: tempDir,
					runtimeConfig: { public: {} },
					alias: {},
				},
				hook: vi.fn(),
			};

			await (module as any).setup(
				{ schemaPath: "./env.ts", validate: false },
				mockNuxt,
			);

			expect(mockNuxt.options.alias["#arkenv/client-env"]).toBeUndefined();
			expect(mockNuxt.options.alias["#arkenv/shared-schema"]).toBeUndefined();
			expect(mockNuxt.options.alias["#arkenv/server-boot"]).toBeDefined();

			expect(
				mockNuxt.hook.mock.calls.find(
					([name]: [string, ...any[]]) => name === "prepare:types",
				),
			).toBeUndefined();

			const nitroConfig: any = { alias: {} };
			runHooks(mockNuxt, "nitro:config", nitroConfig);
			expect(nitroConfig.alias["#arkenv/client-env"]).toBeUndefined();
			expect(nitroConfig.alias["#arkenv/shared-schema"]).toBeUndefined();
			expect(nitroConfig.alias["#arkenv/server-boot"]).toBeDefined();

			const config: any = { plugins: [], resolve: { alias: {} } };
			runHooks(mockNuxt, "vite:extendConfig", config, { isClient: false });

			expect(config.define?.__ARKENV_STRICT_LAYOUT__).toBeUndefined();
			expect(
				config.plugins?.find((p: any) => p.name === "arkenv-nuxt-client-env"),
			).toBeUndefined();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("throws when no schema file is found", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-missing-schema");
		fs.mkdirSync(tempDir, { recursive: true });

		const mockNuxt: any = {
			options: {
				dev: false,
				rootDir: tempDir,
				runtimeConfig: {
					public: {},
				},
			},
			hook: vi.fn(),
		};

		try {
			let message = "";
			try {
				(module as any).setup({ validate: false }, mockNuxt);
			} catch (error) {
				message = error instanceof Error ? error.message : String(error);
			}

			expect(message).toMatch(
				/\[ArkEnv\] Could not find schema file at src\/env\.ts or env\.ts/,
			);
			expect(message).toMatch(/npx arkenv@latest init/);
			expect(message).not.toMatch(/Example `src\/env\.ts`/);
			expect(message).not.toMatch(/```/);
			expect(mockNuxt.hook).not.toHaveBeenCalled();
			expect(mockNuxt.options.runtimeConfig.DATABASE_URL).toBeUndefined();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("throws when schemaPath points to a missing file", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-missing-schema-path");
		fs.mkdirSync(tempDir, { recursive: true });

		const mockNuxt: any = {
			options: {
				dev: false,
				rootDir: tempDir,
				runtimeConfig: {
					public: {},
				},
			},
			hook: vi.fn(),
		};

		try {
			expect(() =>
				(module as any).setup(
					{ schemaPath: "./missing-env.ts", validate: false },
					mockNuxt,
				),
			).toThrow(/\[ArkEnv\] Could not find schema file at \.\/missing-env\.ts/);
			expect(mockNuxt.hook).not.toHaveBeenCalled();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
