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

	it("plans for nextjs framework", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, framework: "nextjs" },
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/nextjs");
		expect(plan.files.some((f) => f.path.endsWith("env.d.ts"))).toBe(false);
		expect(plan.bootstrap).toBeUndefined();
	});

	it("plans for nextjs framework with zod validator", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				validator: "zod",
			},
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/nextjs");
		expect(plan.install?.dependencies).toContain("zod");
		expect(plan.install?.dependencies).toContain("arktype");
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

	it("sets targetDir to a named subdirectory when name is not '.'", () => {
		const state: CollectedState = {
			...defaultState,
			mode: "new",
			cwd: "/parent",
			options: {
				...defaultState.options,
				mode: "new",
				example: "basic",
				name: "my-app",
				path: "./src/env.ts",
			},
		};
		const plan = createPlan(state);
		expect(plan.clone).toBeDefined();
		expect(plan.clone?.targetDir).toBe("/parent/my-app");
		expect(plan.clone?.targetName).toBe("my-app");
		expect(plan.install?.cwd).toBe("/parent/my-app");
	});

	it("omits targetDir when name is '.' so cloner falls back to cwd", () => {
		const state: CollectedState = {
			...defaultState,
			mode: "new",
			cwd: "/parent",
			options: {
				...defaultState.options,
				mode: "new",
				example: "basic",
				name: ".",
				path: "./src/env.ts",
			},
		};
		const plan = createPlan(state);
		expect(plan.clone).toBeDefined();
		expect(plan.clone?.targetDir).toBeUndefined();
		expect(plan.clone?.targetName).toBe("parent");
		expect(plan.install?.cwd).toBeUndefined();
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

	it("plans three files for nextjs framework in strict layout", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				layout: "strict",
				path: "src/env.ts",
			},
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.files).toHaveLength(3);

		const sharedFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/shared.ts"),
		);
		const clientFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/client.ts"),
		);
		const serverFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/server.ts"),
		);

		expect(sharedFile).toBeDefined();
		expect(clientFile).toBeDefined();
		expect(serverFile).toBeDefined();

		expect(sharedFile?.content).toContain("@arkenv/nextjs/shared");
		expect(clientFile?.content).toContain("@arkenv/nextjs/client");
		expect(serverFile?.content).toContain("@arkenv/nextjs/server");
	});

	it("plans all three strict layout files as overwrite on rerun when they already exist", () => {
		const sharedPath = path.resolve("/test", "src/env/shared.ts");
		const clientPath = path.resolve("/test", "src/env/client.ts");
		const serverPath = path.resolve("/test", "src/env/server.ts");

		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				layout: "strict",
				path: "src/env.ts",
				overwriteEnvSchemaFile: true,
			},
			detectedFramework: "nextjs",
			existingFiles: [sharedPath, clientPath, serverPath],
		};
		const plan = createPlan(state);
		expect(plan.files).toHaveLength(3);

		const sharedFile = plan.files.find((f) => f.path === sharedPath);
		const clientFile = plan.files.find((f) => f.path === clientPath);
		const serverFile = plan.files.find((f) => f.path === serverPath);

		// All three must be "overwrite", not "create"
		expect(sharedFile?.action).toBe("overwrite");
		expect(clientFile?.action).toBe("overwrite");
		expect(serverFile?.action).toBe("overwrite");
	});
});
