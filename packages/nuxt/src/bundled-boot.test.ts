import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	cloneRuntimeConfig,
	projectPublicProcessEnv,
	runBundledBootGate,
} from "./boot-gate-apply";
import { resetBootGateResultForTests } from "./boot-gate-state";
import { createBundledSchemaVirtualModules } from "./bundled-schema";
import {
	fromCaptureModuleId,
	toCaptureModuleId,
} from "./schema-capture-plugin";

afterEach(() => {
	resetBootGateResultForTests();
	vi.restoreAllMocks();
	delete process.env.NUXT_PUBLIC_PORT;
	delete process.env.NUXT_PUBLIC_LABEL;
	delete (globalThis as { _importMeta_?: unknown })._importMeta_;
});

describe("bundled schema module ids", () => {
	it("round-trips a capture id without colliding with the real file", () => {
		const filePath = path.join("/app", "env.ts");
		const captureId = toCaptureModuleId(filePath);
		expect(captureId).not.toBe(filePath);
		expect(captureId.endsWith(".ts")).toBe(true);
		expect(fromCaptureModuleId(captureId)).toBe(filePath);
		expect(fromCaptureModuleId(filePath)).toBeNull();
	});

	it("round-trips an extensionless capture id", () => {
		const filePath = path.join("/app", "env");
		const captureId = toCaptureModuleId(filePath);
		expect(captureId).toBe(`${filePath}.arkenv-capture`);
		expect(path.extname(captureId)).toBe(".arkenv-capture");
		expect(fromCaptureModuleId(captureId)).toBe(filePath);
		expect(fromCaptureModuleId(`${captureId}?v=1`)).toBe(filePath);
	});

	it("puts the capture prelude import ahead of the schema module", () => {
		const source = createBundledSchemaVirtualModules({
			engine: "arktype",
			captureRuntimePath: "/pkg/bundled-schema.js",
			captureModuleId: toCaptureModuleId("/app/env.ts"),
		})["#arkenv/schema"];

		expect(source.indexOf("#arkenv/schema-capture-prelude")).toBeLessThan(
			source.indexOf(".arkenv-capture"),
		);
		expect(source).toContain('from "@arkenv/core"');
		expect(source).not.toContain("createJiti");
		expect(source).not.toContain("schemaPath");
	});

	it("imports the standard engine when that module is selected", () => {
		const source = createBundledSchemaVirtualModules({
			engine: "standard",
			captureRuntimePath: "/pkg/bundled-schema.js",
			captureModuleId: toCaptureModuleId("/app/env.ts"),
		})["#arkenv/schema"];

		expect(source).toContain('from "@arkenv/standard"');
		expect(source).not.toContain('from "@arkenv/core"');
	});
});

describe("bundled boot gate", () => {
	it("validates when Nitro's placeholder import.meta.url cannot name a package directory", () => {
		const placeholder = "file:///_entry.js";
		(globalThis as { _importMeta_?: { url: string } })._importMeta_ = {
			url: placeholder,
		};

		let packageDir = "";
		let invalidFileUrl = false;
		try {
			packageDir = path.dirname(fileURLToPath(placeholder));
		} catch (error) {
			invalidFileUrl =
				error instanceof Error &&
				"code" in error &&
				error.code === "ERR_INVALID_FILE_URL_PATH";
		}
		expect(packageDir === "/" || invalidFileUrl).toBe(true);

		const runtimeConfig = {
			public: { NUXT_PUBLIC_PORT: "4000" },
			DATABASE_URL: "postgres://localhost/db",
			PORT: "8080",
		};

		runBundledBootGate(
			{
				engine: "arktype",
				publicKeys: ["NUXT_PUBLIC_PORT"],
				schema: {
					NUXT_PUBLIC_PORT: "number",
					DATABASE_URL: "string",
					PORT: "number",
				} as never,
				coreArkenv: (_schema, config) => {
					const env = config?.env ?? {};
					const port = Number(env.NUXT_PUBLIC_PORT);
					if (Number.isNaN(port)) {
						throw new Error("NUXT_PUBLIC_PORT must be a number");
					}
					return {
						NUXT_PUBLIC_PORT: port,
						DATABASE_URL: env.DATABASE_URL,
						PORT: Number(env.PORT),
					};
				},
			},
			runtimeConfig,
		);

		expect(runtimeConfig.public.NUXT_PUBLIC_PORT).toBe(4000);
		expect(typeof runtimeConfig.public.NUXT_PUBLIC_PORT).toBe("number");
		expect(runtimeConfig.DATABASE_URL).toBe("postgres://localhost/db");
		expect(runtimeConfig.PORT).toBe(8080);
	});

	it("projects an empty public env override over a baked runtimeConfig value", () => {
		process.env.NUXT_PUBLIC_LABEL = "";
		process.env.NUXT_PUBLIC_PORT = "4000";
		const runtimeConfig = cloneRuntimeConfig({
			public: {
				NUXT_PUBLIC_LABEL: "from-build",
				NUXT_PUBLIC_PORT: "",
			},
		});

		projectPublicProcessEnv(
			runtimeConfig,
			new Set(["NUXT_PUBLIC_LABEL", "NUXT_PUBLIC_PORT"]),
		);

		expect(runtimeConfig.public?.NUXT_PUBLIC_LABEL).toBe("");
		expect(runtimeConfig.public?.NUXT_PUBLIC_PORT).toBe("4000");
	});

	it("does not read a schema file or jiti from the runtime boot modules", () => {
		const runtimeFiles = [
			"boot-gate-apply.ts",
			"bundled-schema.ts",
			"server-boot.ts",
			"runtime/nitro-boot-plugin.ts",
		];
		for (const file of runtimeFiles) {
			const source = fs.readFileSync(path.join(__dirname, file), "utf8");
			expect(source).not.toContain("createJiti");
			expect(source).not.toContain("fileURLToPath");
			expect(source).not.toContain("schemaPath");
		}
	});
});
