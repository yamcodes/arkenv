import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import module from "./module";

vi.mock("@nuxt/kit", () => {
	return {
		defineNuxtModule: (config: any) => {
			return {
				...config,
				// expose setup directly for tests
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
 *
 * @param mockNuxt The mock Nuxt instance with a vi.fn hook
 * @param name Hook name
 * @param args Arguments forwarded to each handler
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
			// Run module setup
			await (module as any).setup(
				{
					schemaPath: "./env.ts",
					validate: false,
				},
				mockNuxt,
			);

			// Check if runtimeConfig was populated
			expect(mockNuxt.options.runtimeConfig.DATABASE_URL).toBeDefined();
			expect(
				mockNuxt.options.runtimeConfig.public.NUXT_PUBLIC_API_URL,
			).toBeDefined();
			expect(mockNuxt.options.runtimeConfig.public.NODE_ENV).toBeDefined();
			expect(mockNuxt.options.runtimeConfig.arkenvGate).toMatchObject({
				layout: "simple",
				engine: "arktype",
			});

			// Check if vite hook was registered
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
			// Run module setup
			await (module as any).setup(
				{
					schemaPath: "./env.ts",
					validate: false,
				},
				mockNuxt,
			);

			// Check if vite hook was registered
			expect(mockNuxt.hook).toHaveBeenCalledWith(
				"vite:extendConfig",
				expect.any(Function),
			);

			// Check if schemaPath was added to watch paths
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
					layout: "flat",
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

	it("registers #arkenv/client-env and #arkenv/shared-schema aliases in strict layout", async () => {
		const tempDir = path.resolve(__dirname, "temp-strict-alias-test");
		const envDir = path.join(tempDir, "env");
		fs.mkdirSync(path.join(envDir, "internal"), { recursive: true });

		try {
			const clientPath = path.join(envDir, "client.ts");
			const sharedPath = path.join(envDir, "internal", "shared.ts");
			fs.writeFileSync(clientPath, "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");
			fs.writeFileSync(sharedPath, "export const SharedSchema = {}");

			const mockNuxt: any = {
				options: {
					dev: false,
					rootDir: tempDir,
					srcDir: tempDir,
					runtimeConfig: { public: {} },
					alias: {},
				},
				hook: vi.fn(),
			};

			await (module as any).setup(
				{
					schemaPath: "./env/server.ts",
					layout: "strict",
					validate: false,
				},
				mockNuxt,
			);

			expect(mockNuxt.options.alias["#arkenv/client-env"]).toBe(clientPath);
			expect(mockNuxt.options.alias["#arkenv/shared-schema"]).toBe(sharedPath);

			const prepareTypesHook = mockNuxt.hook.mock.calls.find(
				([name]: [string, ...any[]]) => name === "prepare:types",
			)?.[1];
			expect(prepareTypesHook).toBeDefined();
			const tsConfig: any = { compilerOptions: {} };
			prepareTypesHook({ tsConfig });
			expect(tsConfig.compilerOptions.paths["#arkenv/client-env"]).toEqual([
				clientPath,
			]);
			expect(tsConfig.compilerOptions.paths["#arkenv/shared-schema"]).toEqual([
				sharedPath,
			]);

			const nitroConfig: any = {};
			runHooks(mockNuxt, "nitro:config", nitroConfig);
			expect(nitroConfig.alias["#arkenv/client-env"]).toBe(clientPath);
			expect(nitroConfig.alias["#arkenv/shared-schema"]).toBe(sharedPath);
			expect(nitroConfig.replace.__ARKENV_STRICT_LAYOUT__).toBe("true");
			expect(nitroConfig.alias["#arkenv/server-boot"]).toBeDefined();

			const serverConfig: any = {
				plugins: [],
				resolve: { alias: {} },
				define: {},
			};
			runHooks(mockNuxt, "vite:extendConfig", serverConfig, {
				isClient: false,
			});

			expect(serverConfig.define.__ARKENV_STRICT_LAYOUT__).toBe("true");
			expect(serverConfig.resolve.alias["#arkenv/client-env"]).toBe(clientPath);
			expect(serverConfig.resolve.alias["#arkenv/shared-schema"]).toBe(
				sharedPath,
			);

			const clientEnvPlugin = serverConfig.plugins.find(
				(p: any) => p.name === "arkenv-nuxt-client-env",
			);
			expect(clientEnvPlugin).toBeDefined();
			expect(clientEnvPlugin.resolveId("#arkenv/client-env")).toBe(clientPath);

			const sharedSchemaPlugin = serverConfig.plugins.find(
				(p: any) => p.name === "arkenv-nuxt-shared-schema",
			);
			expect(sharedSchemaPlugin).toBeDefined();
			expect(sharedSchemaPlugin.resolveId("#arkenv/shared-schema")).toBe(
				sharedPath,
			);

			const clientConfig: any = {
				plugins: [],
				resolve: { alias: {} },
				define: {},
			};
			runHooks(mockNuxt, "vite:extendConfig", clientConfig, { isClient: true });
			expect(clientConfig.define.__ARKENV_STRICT_LAYOUT__).toBe("true");
			expect(
				clientConfig.plugins.find(
					(p: any) => p.name === "arkenv-nuxt-client-security",
				),
			).toBeDefined();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("throws when strict layout is missing client.ts", async () => {
		const tempDir = path.resolve(__dirname, "temp-strict-missing-client");
		const envDir = path.join(tempDir, "env");
		fs.mkdirSync(path.join(envDir, "internal"), { recursive: true });

		try {
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");
			fs.writeFileSync(
				path.join(envDir, "internal", "shared.ts"),
				"export const SharedSchema = {}",
			);

			const mockNuxt: any = {
				options: {
					dev: false,
					rootDir: tempDir,
					srcDir: tempDir,
					runtimeConfig: { public: {} },
				},
				hook: vi.fn(),
			};

			expect(() =>
				(module as any).setup(
					{
						schemaPath: "./env",
						layout: "strict",
						validate: false,
					},
					mockNuxt,
				),
			).toThrow(/Strict layout requires/);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("throws when strict layout is missing internal/shared.ts", async () => {
		const tempDir = path.resolve(__dirname, "temp-strict-missing-shared");
		const envDir = path.join(tempDir, "env");
		fs.mkdirSync(envDir, { recursive: true });

		try {
			fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");

			const mockNuxt: any = {
				options: {
					dev: false,
					rootDir: tempDir,
					srcDir: tempDir,
					runtimeConfig: { public: {} },
				},
				hook: vi.fn(),
			};

			expect(() =>
				(module as any).setup(
					{
						schemaPath: "./env",
						layout: "strict",
						validate: false,
					},
					mockNuxt,
				),
			).toThrow(/internal\/shared\.ts/);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("does not register alias or define flag in simple layout", async () => {
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
				{ schemaPath: "./env.ts", layout: "flat", validate: false },
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
				config.plugins.find((p: any) => p.name === "arkenv-nuxt-client-env"),
			).toBeUndefined();
			expect(
				config.plugins.find((p: any) => p.name === "arkenv-nuxt-shared-schema"),
			).toBeUndefined();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("emits arkenv-specific error when #arkenv/client-env cannot be resolved", async () => {
		const tempDir = path.resolve(__dirname, "temp-unresolved-client-env");
		const envDir = path.join(tempDir, "env");
		fs.mkdirSync(path.join(envDir, "internal"), { recursive: true });

		try {
			const clientPath = path.join(envDir, "client.ts");
			fs.writeFileSync(clientPath, "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");
			fs.writeFileSync(
				path.join(envDir, "internal", "shared.ts"),
				"export const SharedSchema = {}",
			);

			const mockNuxt: any = {
				options: {
					dev: false,
					rootDir: tempDir,
					srcDir: tempDir,
					runtimeConfig: { public: {} },
					alias: {},
				},
				hook: vi.fn(),
			};

			await (module as any).setup(
				{
					schemaPath: "./env/server.ts",
					layout: "strict",
					validate: false,
				},
				mockNuxt,
			);

			const config: any = { plugins: [], resolve: { alias: {} } };
			runHooks(mockNuxt, "vite:extendConfig", config, { isClient: false });

			const plugin = config.plugins.find(
				(p: any) => p.name === "arkenv-nuxt-client-env",
			);

			fs.unlinkSync(clientPath);

			expect(() => plugin.resolveId("#arkenv/client-env")).toThrow(
				/Could not resolve #arkenv\/client-env/,
			);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("emits arkenv-specific error when #arkenv/shared-schema cannot be resolved", async () => {
		const tempDir = path.resolve(__dirname, "temp-unresolved-shared-schema");
		const envDir = path.join(tempDir, "env");
		fs.mkdirSync(path.join(envDir, "internal"), { recursive: true });

		try {
			const sharedPath = path.join(envDir, "internal", "shared.ts");
			fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {}");
			fs.writeFileSync(path.join(envDir, "server.ts"), "export const env = {}");
			fs.writeFileSync(sharedPath, "export const SharedSchema = {}");

			const mockNuxt: any = {
				options: {
					dev: false,
					rootDir: tempDir,
					srcDir: tempDir,
					runtimeConfig: { public: {} },
					alias: {},
				},
				hook: vi.fn(),
			};

			await (module as any).setup(
				{
					schemaPath: "./env/server.ts",
					layout: "strict",
					validate: false,
				},
				mockNuxt,
			);

			const config: any = { plugins: [], resolve: { alias: {} } };
			runHooks(mockNuxt, "vite:extendConfig", config, { isClient: false });

			const plugin = config.plugins.find(
				(p: any) => p.name === "arkenv-nuxt-shared-schema",
			);

			fs.unlinkSync(sharedPath);

			expect(() => plugin.resolveId("#arkenv/shared-schema")).toThrow(
				/Could not resolve #arkenv\/shared-schema/,
			);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
