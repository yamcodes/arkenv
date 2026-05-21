import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CollectedState } from "./plan";
import { createPlan } from "./planner";

describe("Planner", () => {
	const defaultState: CollectedState = {
		mode: "existing",
		cwd: "/test",
		options: {
			validator: "arktype",
			framework: "vanilla",
			path: "env.ts",
			language: "ts",
			installTypeDefinitions: true,
		},
		detectedFramework: "vanilla",
		packageManager: "pnpm",
		tsConfig: { status: "strict", file: "tsconfig.json" },
		shouldUpdateTsConfig: false,
		existingFiles: [],
		isYes: false,
	};

	it("creates a basic plan", () => {
		const plan = createPlan(defaultState);
		expect(plan.files).toHaveLength(1);
		expect(plan.files[0].path).toBe(path.resolve("/test", "env.ts"));
		expect(plan.files[0].action).toBe("create");
		expect(plan.files[0].content).toContain("export");
		expect(plan.files[0].content).toContain("type");
		expect(plan.install?.dependencies).toContain("arkenv");
		expect(plan.install?.dependencies).toContain("arktype");
	});

	it("plans for vite framework", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, framework: "vite" },
			detectedFramework: "vite",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/vite-plugin");
		expect(plan.files.some((f) => f.path.endsWith("vite-env.d.ts"))).toBe(true);
		expect(plan.bootstrap?.framework).toBe("vite");
	});

	it("plans for bun-fullstack framework with features", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "bun-fullstack",
				bunFeatures: ["serve"],
			},
			detectedFramework: "bun-fullstack",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/bun-plugin");
		expect(plan.files.some((f) => f.path.endsWith("bun-env.d.ts"))).toBe(true);
		expect(plan.bootstrap?.framework).toBe("bun-fullstack");
		expect(plan.bootstrap?.bunFeatures).toContain("serve");
	});

	it("plans for bun-fullstack framework without features", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "bun-fullstack",
				bunFeatures: [],
			},
			detectedFramework: "bun-fullstack",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).not.toContain("@arkenv/bun-plugin");
		expect(plan.files.some((f) => f.path.endsWith("bun-env.d.ts"))).toBe(false);
		expect(plan.bootstrap?.framework).toBe("bun-fullstack");
		expect(plan.bootstrap?.bunFeatures).toEqual([]);
	});

	it("plans tsconfig update when requested", () => {
		const state: CollectedState = {
			...defaultState,
			tsConfig: { status: "not_strict", file: "tsconfig.json" },
			shouldUpdateTsConfig: true,
		};
		const plan = createPlan(state);
		expect(plan.tsConfig?.action).toBe("strict");
		expect(plan.tsConfig?.path).toBe(path.resolve("/test", "tsconfig.json"));
	});

	it("plans overwrite when file exists and allowed", () => {
		const targetPath = path.resolve("/test", "env.ts");
		const state: CollectedState = {
			...defaultState,
			existingFiles: [targetPath],
			options: { ...defaultState.options, overwriteEnvSchemaFile: true },
		};
		const plan = createPlan(state);
		expect(plan.files[0].action).toBe("overwrite");
	});

	it("plans append when type definition exists and requested", () => {
		const typePath = path.resolve("/test", "vite-env.d.ts");
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "vite",
				envDtsHandling: "append",
			},
			existingFiles: [typePath],
		};
		const plan = createPlan(state);
		const typeFile = plan.files.find((f) => f.path === typePath);
		expect(typeFile?.action).toBe("append");
	});

	it("plans skill installation", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, installSkill: true },
		};
		const plan = createPlan(state);
		expect(plan.skill).toBeDefined();
		expect(plan.skill?.packageName).toBe("yamcodes/arkenv");
		expect(plan.skill?.dlxCommand).toEqual(["pnpm", "dlx"]);
	});

	it("normalizes metadata paths", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, path: "src/env.ts" },
		};
		const plan = createPlan(state);
		// path.relative will use forward slashes on POSIX, but we want to ensure
		// our normalization handles the output regardless of platform.
		expect(plan.metadata.displayPath).toBe("./src/env.ts");
		expect(plan.metadata.importPath).toBe("./src/env");
	});

	it("extracts basename for targetName in new project mode", () => {
		const state: CollectedState = {
			mode: "new",
			cwd: "/test/yo/my-project",
			options: {
				mode: "new",
				example: "basic",
				name: "yo/my-project",
				framework: "vanilla",
				path: "./src/env.ts",
				validator: "arktype",
				language: "ts",
				installSkill: false,
			},
			detectedFramework: "vanilla",
			packageManager: "pnpm",
			tsConfig: { status: "not_found" },
			shouldUpdateTsConfig: false,
			existingFiles: [],
			isYes: false,
		};
		const plan = createPlan(state);
		expect(plan.clone?.targetName).toBe("my-project");
	});
});
