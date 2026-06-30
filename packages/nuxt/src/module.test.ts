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

describe("Nuxt module integration", () => {
	it("should parse and register variables to nuxt.options.runtimeConfig", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-test");
		fs.mkdirSync(tempDir, { recursive: true });

		const schemaPath = path.join(tempDir, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`
			import { createEnv } from "@arkenv/nuxt";
			export const env = createEnv({
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
			import { createEnv } from "@arkenv/nuxt";
			export const env = createEnv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string"
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

	it("should throw when validation fails and validate is enabled", async () => {
		const tempDir = path.resolve(__dirname, "temp-module-validation-test");
		fs.mkdirSync(tempDir, { recursive: true });

		const schemaPath = path.join(tempDir, "env.ts");
		fs.writeFileSync(
			schemaPath,
			`
			import { createEnv } from "@arkenv/nuxt";
			export const env = createEnv({
				DATABASE_URL: "string",
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
			// Now enable validation; DATABASE_URL is missing
			expect(() =>
				(module as any).setup(
					{
						schemaPath: "./env.ts",
						validate: true,
					},
					mockNuxt,
				),
			).toThrow("[ArkEnv] Environment validation failed");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should block userland server imports on the client but allow them on the server", async () => {
		const tempDir = path.resolve(__dirname, "temp-strict-security-test");
		const envDir = path.join(tempDir, "env");
		fs.mkdirSync(envDir, { recursive: true });
		fs.mkdirSync(path.join(envDir, "internal"), { recursive: true });

		try {
			fs.writeFileSync(path.join(envDir, "client.ts"), "export const env = {}");
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
					runtimeConfig: {
						public: {},
					},
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

			const viteHook = mockNuxt.hook.mock.calls.find(
				([name]: [string, ...any[]]) => name === "vite:extendConfig",
			)?.[1];

			expect(viteHook).toBeDefined();

			const clientConfig: any = { plugins: [] };
			viteHook(clientConfig, { isClient: true });

			const plugin = clientConfig.plugins.find(
				(p: any) => p.name === "arkenv-nuxt-client-security",
			);
			expect(plugin).toBeDefined();

			const errorMessage =
				"[ArkEnv] Importing server-only environment schema on the client is not allowed!";

			expect(() => plugin.resolveId(path.join(envDir, "server.ts"))).toThrow(
				errorMessage,
			);

			expect(() => plugin.resolveId("~/env/server.ts")).toThrow(errorMessage);
			expect(() => plugin.resolveId("~~/env/server.ts")).toThrow(errorMessage);
			expect(() => plugin.resolveId("@/env/server.ts")).toThrow(errorMessage);

			expect(() =>
				plugin.resolveId("./server.ts", path.join(envDir, "client.ts")),
			).toThrow(errorMessage);
			expect(() =>
				plugin.resolveId(
					"../env/server.ts",
					path.join(envDir, "internal", "shared.ts"),
				),
			).toThrow(errorMessage);

			expect(() => plugin.resolveId("@arkenv/nuxt/server")).toThrow(
				errorMessage,
			);

			expect(() =>
				plugin.resolveId(path.join(envDir, "client.ts")),
			).not.toThrow();

			expect(() =>
				plugin.resolveId("./client.ts", path.join(envDir, "server.ts")),
			).not.toThrow();

			expect(() =>
				plugin.resolveId(path.join(tempDir, "server.ts")),
			).not.toThrow();

			const serverConfig: any = { plugins: [] };
			viteHook(serverConfig, { isClient: false });
			const serverPlugin = serverConfig.plugins.find(
				(p: any) => p.name === "arkenv-nuxt-client-security",
			);
			expect(serverPlugin).toBeUndefined();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
