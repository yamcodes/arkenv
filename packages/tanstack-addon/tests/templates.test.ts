import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");

const envTemplate = readFileSync(
	resolve(packageRoot, ".add-on/assets/src/env.ts.ejs"),
	"utf-8",
);
const packageTemplate = readFileSync(
	resolve(packageRoot, ".add-on/package.json.ejs"),
	"utf-8",
);
const demoRouteTemplate = readFileSync(
	resolve(packageRoot, ".add-on/assets/src/routes/demo/arkenv.tsx.ejs"),
	"utf-8",
);

describe("Template Rendering", () => {
	describe("src/env.ts.ejs", () => {
		it("renders ArkType syntax by default when no options provided", () => {
			const rendered = ejs.render(envTemplate, { addOnOption: {} });
			expect(rendered).toContain('import arkenv from "@arkenv/core";');
			expect(rendered).toContain('PORT: "number.port = 3000"');
			expect(rendered).toContain(
				"DATABASE_URL: \"string = 'postgresql://postgres:postgres@localhost:5432/db'\"",
			);
			expect(rendered).not.toContain("@arkenv/standard");
		});

		it("renders ArkType syntax when explicitly selected", () => {
			const rendered = ejs.render(envTemplate, {
				addOnOption: { arkenv: { validator: "arktype" } },
			});
			expect(rendered).toContain('import arkenv from "@arkenv/core";');
			expect(rendered).toContain('PORT: "number.port = 3000"');
		});

		it("renders Zod syntax when validator is zod", () => {
			const rendered = ejs.render(envTemplate, {
				addOnOption: { arkenv: { validator: "zod" } },
			});
			expect(rendered).toContain('import arkenv from "@arkenv/standard";');
			expect(rendered).toContain('import { z } from "zod";');
			expect(rendered).toContain(
				"z.coerce.number().int().min(1).max(65535).default(3000)",
			);
			expect(rendered).not.toContain("@arkenv/core");
		});

		it("renders Valibot syntax when validator is valibot", () => {
			const rendered = ejs.render(envTemplate, {
				addOnOption: { arkenv: { validator: "valibot" } },
			});
			expect(rendered).toContain('import arkenv from "@arkenv/standard";');
			expect(rendered).toContain('import * as v from "valibot";');
			expect(rendered).toContain(
				"v.optional(v.pipe(v.unknown(), v.transform(Number), v.integer()), 3000)",
			);
			expect(rendered).not.toContain("@arkenv/core");
		});

		it("handles remote URL add-on ID fallback correctly", () => {
			const rendered = ejs.render(envTemplate, {
				addOnOption: {
					"https://arkenv.js.org/tanstack/info.json": { validator: "zod" },
				},
			});
			expect(rendered).toContain('import arkenv from "@arkenv/standard";');
			expect(rendered).toContain('import { z } from "zod";');
		});

		it("handles preview URL add-on ID fallback correctly", () => {
			const rendered = ejs.render(envTemplate, {
				addOnOption: {
					"https://arkenv-v1.vercel.app/tanstack/info.json": {
						validator: "valibot",
					},
				},
			});
			expect(rendered).toContain('import arkenv from "@arkenv/standard";');
			expect(rendered).toContain('import * as v from "valibot";');
		});
	});

	describe("package.json.ejs", () => {
		it("renders valid JSON with ArkType dependencies by default", () => {
			const rendered = ejs.render(packageTemplate, { addOnOption: {} });
			const parsed = JSON.parse(rendered);

			expect(parsed.dependencies["@arkenv/core"]).toBeDefined();
			expect(parsed.dependencies.arktype).toBeDefined();
			expect(parsed.dependencies["@arkenv/standard"]).toBeUndefined();
			expect(parsed.devDependencies["@arkenv/vite-plugin"]).toBeDefined();
		});

		it("renders valid JSON with Zod dependencies", () => {
			const rendered = ejs.render(packageTemplate, {
				addOnOption: { arkenv: { validator: "zod" } },
			});
			const parsed = JSON.parse(rendered);

			expect(parsed.dependencies["@arkenv/standard"]).toBeDefined();
			expect(parsed.dependencies.zod).toBeDefined();
			expect(parsed.dependencies["@arkenv/core"]).toBeUndefined();
			expect(parsed.devDependencies["@arkenv/vite-plugin"]).toBeDefined();
		});

		it("renders valid JSON with Valibot dependencies", () => {
			const rendered = ejs.render(packageTemplate, {
				addOnOption: { arkenv: { validator: "valibot" } },
			});
			const parsed = JSON.parse(rendered);

			expect(parsed.dependencies["@arkenv/standard"]).toBeDefined();
			expect(parsed.dependencies.valibot).toBeDefined();
			expect(parsed.dependencies["@arkenv/core"]).toBeUndefined();
			expect(parsed.devDependencies["@arkenv/vite-plugin"]).toBeDefined();
		});

		it("renders valid JSON when keyed by remote URL ID", () => {
			const rendered = ejs.render(packageTemplate, {
				addOnOption: {
					"https://arkenv.js.org/tanstack/info.json": { validator: "zod" },
				},
			});
			const parsed = JSON.parse(rendered);

			expect(parsed.dependencies["@arkenv/standard"]).toBeDefined();
			expect(parsed.dependencies.zod).toBeDefined();
		});
	});

	describe("src/routes/demo/arkenv.tsx.ejs", () => {
		it("renders demo route by default", () => {
			const rendered = ejs.render(demoRouteTemplate, {
				addOnOption: {},
				includeExamples: true,
			});
			expect(rendered).toContain('createFileRoute("/demo/arkenv")');
			expect(rendered).toContain("LeakedSecret");
			expect(rendered).toContain("DATABASE_URL");
		});

		it("calls ignoreFile when demo option is false", () => {
			let ignored = false;
			ejs.render(demoRouteTemplate, {
				addOnOption: { arkenv: { demo: "false" } },
				ignoreFile: () => {
					ignored = true;
				},
			});
			expect(ignored).toBe(true);
		});

		it("calls ignoreFile when includeExamples is false", () => {
			let ignored = false;
			ejs.render(demoRouteTemplate, {
				addOnOption: { arkenv: { demo: "true" } },
				includeExamples: false,
				ignoreFile: () => {
					ignored = true;
				},
			});
			expect(ignored).toBe(true);
		});

		it("calls ignoreFile when demo option is false via URL ID", () => {
			let ignored = false;
			ejs.render(demoRouteTemplate, {
				addOnOption: {
					"https://arkenv.js.org/tanstack/info.json": { demo: "false" },
				},
				ignoreFile: () => {
					ignored = true;
				},
			});
			expect(ignored).toBe(true);
		});
	});
});
