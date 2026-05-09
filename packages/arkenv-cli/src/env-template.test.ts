import { describe, expect, it } from "vitest";
import { getEnvTemplate } from "./env-template";

describe("env-template", () => {
	describe("getEnvTemplate", () => {
		it("returns arktype template when validator is arktype", () => {
			const options = {
				validator: "arktype" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("import arkenv, { type } from \"arkenv\"");
			expect(template).toContain("For Node.js");
		});

		it("returns zod template when validator is zod", () => {
			const options = {
				validator: "zod" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("import { z } from \"zod\"");
			expect(template).toContain("For Node.js");
		});

		it("returns valibot template when validator is valibot", () => {
			const options = {
				validator: "valibot" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("import * as v from \"valibot\"");
			expect(template).toContain("For Node.js");
		});

		it("throws error for unsupported validator", () => {
			const options = {
				validator: "unknown" as any,
				framework: "node" as any,
				path: ".env.config.ts",
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			expect(() => getEnvTemplate(options)).toThrow("Unsupported validator: unknown");
		});

		it("includes framework note for vite", () => {
			const options = {
				validator: "zod" as any,
				framework: "vite" as any,
				path: ".env.config.ts",
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("For Vite");
		});

		it("includes framework note for bun", () => {
			const options = {
				validator: "zod" as any,
				framework: "bun" as any,
				path: ".env.config.ts",
				shouldUpdateTsConfig: false,
				shouldInstall: false,
			};
			const template = getEnvTemplate(options);
			expect(template).toContain("For Bun");
		});
	});
});
