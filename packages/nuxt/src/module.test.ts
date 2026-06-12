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
					outputPath: "./generated/env.gen.ts",
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

	it("should set up watcher in dev mode and register close hook", async () => {
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
					outputPath: "./generated/env.gen.ts",
				},
				mockNuxt,
			);

			// Check if vite hook was registered
			expect(mockNuxt.hook).toHaveBeenCalledWith(
				"vite:extendConfig",
				expect.any(Function),
			);

			// Check if close hook was registered
			expect(mockNuxt.hook).toHaveBeenCalledWith("close", expect.any(Function));
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
