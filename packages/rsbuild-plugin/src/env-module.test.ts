import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRsbuild } from "@rsbuild/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	classifyEnvKeys,
	generateClientEnvModule,
	isEnvModuleId,
	isTransformModeCall,
} from "./env-module.js";
import arkenvPlugin from "./index.js";

describe("transform mode helpers", () => {
	it("detects transform-mode calls", () => {
		expect(isTransformModeCall(undefined, undefined)).toBe(true);
		expect(isTransformModeCall({ schemaPath: "src/env.ts" }, undefined)).toBe(
			true,
		);
		expect(isTransformModeCall({ clientPrefix: "PUBLIC_" }, undefined)).toBe(
			true,
		);
		expect(isTransformModeCall({}, undefined)).toBe(true);
		expect(isTransformModeCall({ PUBLIC_FOO: "string" }, undefined)).toBe(
			false,
		);
		expect(
			isTransformModeCall({ PUBLIC_FOO: "string" }, { coerce: true }),
		).toBe(false);
	});

	it("classifies flat-layout keys by client prefix", () => {
		const content = `
			export const env = arkenv({
				DATABASE_URL: "string",
				PUBLIC_API_URL: "string",
				NODE_ENV: "'development' | 'production'",
			});
		`;
		const keys = classifyEnvKeys(content, ["PUBLIC_"]);
		expect(keys.clientKeys).toContain("PUBLIC_API_URL");
		expect(keys.sharedKeys).toContain("NODE_ENV");
		expect(keys.serverKeys).toContain("DATABASE_URL");
	});

	it("generates inlined literals and throwing server-key getters", () => {
		const code = generateClientEnvModule(
			{ PUBLIC_API_URL: "https://api.example.com", PUBLIC_PORT: 8080 },
			["DATABASE_URL"],
		);

		expect(code).toContain('"PUBLIC_API_URL": "https://api.example.com"');
		expect(code).toContain('"PUBLIC_PORT": 8080');
		expect(code).toContain('get ["DATABASE_URL"]()');
		expect(code).toContain(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(code).not.toContain("error.name");
		expect(code).not.toContain("ArkEnvAccessError");
		expect(code).not.toContain("ArkEnv Error:");
		expect(code).not.toMatch(/import\b.*ArkEnvError/);
		expect(code).not.toContain("arkenv");
		expect(code).not.toContain("arktype");
	});

	it("matches env module ids with query suffixes", () => {
		const schemaPath = "/proj/src/env.ts";
		expect(isEnvModuleId("/proj/src/env.ts", schemaPath)).toBe(true);
		expect(isEnvModuleId("/proj/src/env.ts?t=123", schemaPath)).toBe(true);
		expect(isEnvModuleId("/proj/src/other.ts", schemaPath)).toBe(false);
	});
});

type FakeTransform = {
	descriptor: {
		test: (resource: string) => boolean;
		targets: string[];
		order: string;
	};
	handler: (ctx: {
		code: string;
		resourcePath: string;
		addDependency: (file: string) => void;
		addMissingDependency: (file: string) => void;
	}) => string;
};

/**
 * Minimal stand-in for the Rsbuild plugin API surface the plugin consumes.
 */
function createFakeApi(root: string) {
	const beforeCompile: Array<() => void> = [];
	let transform: FakeTransform | undefined;
	const api = {
		context: { rootPath: root, action: "build" as const },
		onBeforeEnvironmentCompile(cb: () => void) {
			beforeCompile.push(cb);
		},
		transform(
			descriptor: FakeTransform["descriptor"],
			handler: FakeTransform["handler"],
		) {
			transform = { descriptor, handler };
		},
	};
	return {
		api,
		getTransform: () => transform,
		getBeforeCompile: () => beforeCompile,
	};
}

describe("transform mode plugin", () => {
	const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
	const temps: string[] = [];

	afterEach(() => {
		for (const dir of temps.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("scopes the rewrite to web targets and registers watch dependencies", async () => {
		const plugin = arkenvPlugin({ schemaPath: "env.ts" });
		const { api, getTransform } = createFakeApi(fixtureDir);
		plugin.setup(api as never);

		const transform = getTransform();
		expect(transform).toBeDefined();
		if (!transform) return;
		expect(transform.descriptor.targets).toEqual(["web", "web-worker"]);
		expect(transform.descriptor.order).toBe("pre");

		const isMatch = transform.descriptor.test;
		expect(isMatch(join(fixtureDir, "env.ts"))).toBe(true);
		expect(isMatch(`${join(fixtureDir, "env.ts")}?t=123`)).toBe(true);
		expect(isMatch(join(fixtureDir, "index.ts"))).toBe(false);

		const addDependency = vi.fn();
		const addMissingDependency = vi.fn();
		const result = await transform.handler({
			code: "export const env = {}",
			resourcePath: join(fixtureDir, "env.ts"),
			addDependency,
			addMissingDependency,
		});

		expect(result).toContain('"PUBLIC_API_URL": "https://fixture.example.com"');
		expect(result).toContain('"PUBLIC_DEBUG": true');
		expect(result).toContain('"PUBLIC_PORT": 8080');
		expect(result).toContain('"NODE_ENV": "test"');
		expect(result).toContain('get ["DATABASE_URL"]()');
		expect(result).toContain(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(result).not.toContain("@arkenv/core");
		expect(result).not.toContain("arktype");

		expect(addDependency).toHaveBeenCalledWith(join(fixtureDir, "env.ts"));
		expect(addDependency).toHaveBeenCalledWith(join(fixtureDir, ".env.test"));
		expect(addMissingDependency).toHaveBeenCalledWith(join(fixtureDir, ".env"));
		expect(addMissingDependency).toHaveBeenCalledWith(
			join(fixtureDir, ".env.local"),
		);
		expect(addMissingDependency).toHaveBeenCalledWith(
			join(fixtureDir, ".env.test.local"),
		);
	});

	it("passes through non-env modules unchanged", async () => {
		const plugin = arkenvPlugin({ schemaPath: "env.ts" });
		const { api, getTransform } = createFakeApi(fixtureDir);
		plugin.setup(api as never);

		const transform = getTransform();
		expect(transform).toBeDefined();
		if (!transform) return;
		const result = await transform.handler({
			code: "export const other = 1",
			resourcePath: join(fixtureDir, "index.ts"),
			addDependency: vi.fn(),
			addMissingDependency: vi.fn(),
		});

		expect(result).toBe("export const other = 1");
	});

	it("registers a build-time validation hook that refreshes state", () => {
		const plugin = arkenvPlugin({ schemaPath: "env.ts" });
		const { api, getBeforeCompile } = createFakeApi(fixtureDir);
		plugin.setup(api as never);

		expect(getBeforeCompile().length).toBe(1);
		expect(() => getBeforeCompile()[0]()).not.toThrow();
	});

	it("throws a discovery error when no env module exists", () => {
		const root = mkdtempSync(join(tmpdir(), "arkenv-rsbuild-missing-"));
		temps.push(root);

		const plugin = arkenvPlugin();
		const { api } = createFakeApi(root);
		expect(() => plugin.setup(api as never)).toThrow(
			/Could not find schema file/,
		);
	});
});

describe("rsbuild builds", () => {
	const fixtureDir = join(__dirname, "__fixtures__", "transform-env");
	const temps: string[] = [];

	afterEach(() => {
		for (const dir of temps.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	function collectJs(dir: string): string {
		const files: string[] = [];
		const walk = (current: string) => {
			for (const entry of readdirSync(current, { withFileTypes: true })) {
				const fullPath = join(current, entry.name);
				if (entry.isDirectory()) {
					walk(fullPath);
				} else if (entry.name.endsWith(".js")) {
					files.push(fullPath);
				}
			}
		};
		walk(dir);
		return files.map((file) => readFileSync(file, "utf8")).join("\n");
	}

	it("inlines public keys in web bundles and preserves env.ts in node bundles", {
		timeout: 120000,
	}, async () => {
		const outDir = mkdtempSync(join(tmpdir(), "arkenv-rsbuild-dual-"));
		temps.push(outDir);

		const rsbuild = await createRsbuild({
			cwd: fixtureDir,
			rsbuildConfig: {
				environments: {
					web: {
						source: { entry: { index: "./index.ts" } },
						output: {
							target: "web",
							distPath: { root: join(outDir, "web") },
						},
					},
					node: {
						source: { entry: { index: "./index.ts" } },
						output: {
							target: "node",
							distPath: { root: join(outDir, "node") },
						},
					},
				},
				plugins: [arkenvPlugin({ schemaPath: "env.ts" })],
			},
		});

		await rsbuild.build();

		const webBundle = collectJs(join(outDir, "web"));
		const nodeBundle = collectJs(join(outDir, "node"));

		// Client bundle: inlined coerced literals for public/shared keys.
		expect(webBundle).toContain("https://fixture.example.com");
		expect(webBundle).toContain("8080");
		expect(webBundle).toContain("PUBLIC_DEBUG");

		// Server-only keys throw at the boundary instead of leaking.
		expect(webBundle).toContain(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(webBundle).not.toContain("postgres://fixture:5432/db");

		// No validator runtime in the client bundle.
		expect(webBundle).not.toContain("@arkenv/core");
		expect(webBundle).not.toContain("arktype");

		// Server bundle: the raw env module with its schema defaults survives.
		expect(nodeBundle).toContain("postgres://localhost:5432/mydb");
		expect(nodeBundle).not.toContain("Do not access server-only key");
	});

	it("fails the build before emitting assets when a required variable is missing", {
		timeout: 120000,
	}, async () => {
		const requiredDir = join(
			__dirname,
			"__fixtures__",
			"transform-env-required",
		);
		const outDir = mkdtempSync(join(tmpdir(), "arkenv-rsbuild-invalid-"));
		temps.push(outDir);

		const previous = process.env.SECRET_TOKEN;
		delete process.env.SECRET_TOKEN;
		try {
			const rsbuild = await createRsbuild({
				cwd: requiredDir,
				rsbuildConfig: {
					environments: {
						web: {
							source: { entry: { index: "./index.ts" } },
							output: {
								target: "web",
								distPath: { root: outDir },
							},
						},
					},
					plugins: [arkenvPlugin({ schemaPath: "env.ts" })],
				},
			});

			await expect(rsbuild.build()).rejects.toThrow(/SECRET_TOKEN/);
			expect(collectJs(outDir)).toBe("");
		} finally {
			if (previous !== undefined) {
				process.env.SECRET_TOKEN = previous;
			}
		}
	});
});
