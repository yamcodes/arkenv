import { beforeEach, describe, expect, it, vi } from "vitest";
import fsp from "node:fs/promises";
import { Executor } from "./executor";
import type { Reporter, ScaffoldingPlan, Workspace } from "./plan";

vi.mock("node:fs/promises", () => ({
	default: {
		readdir: vi.fn().mockResolvedValue(["package.json"]),
		cp: vi.fn().mockResolvedValue(undefined),
		rm: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("Executor", () => {
	const mockWorkspace: Workspace = {
		exists: vi.fn().mockResolvedValue(true),
		readFile: vi.fn().mockResolvedValue(""),
		writeFile: vi.fn(),
		mkdir: vi.fn(),
		execute: vi.fn(),
		updateTsConfigToStrict: vi
			.fn()
			.mockResolvedValue({ status: "updated", file: "tsconfig.json" }),
		findViteConfig: vi.fn().mockResolvedValue("vite.config.ts"),
		findBunConfig: vi.fn().mockResolvedValue("bunfig.toml"),
		bootstrapViteConfig: vi
			.fn()
			.mockResolvedValue({ success: true, updated: true }),
		bootstrapBunConfig: vi
			.fn()
			.mockResolvedValue({ success: true, instructions: "done" }),
		safeAppend: vi.fn().mockResolvedValue(true),
	};

	const mockReporter: Reporter = {
		interactiveStdout: vi.fn(),
		stdio: "inherit",
		spinner: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
		step: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
		log: vi.fn(),
		note: vi.fn(),
		json: vi.fn(),
		cancel: vi.fn(),
		fatal: vi.fn(() => {
			throw new Error("fatal");
		}),
		finish: vi.fn(),
		flush: vi.fn().mockResolvedValue(undefined),
	};

	let executor: Executor;

	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.SKIP_INSTALL;
		executor = new Executor(mockWorkspace, mockReporter);
	});

	const defaultPlan: ScaffoldingPlan = {
		files: [
			{
				path: "env.ts",
				content: "env",
				action: "create",
				label: "environment schema",
			},
		],
		install: { packageManager: "pnpm", dependencies: ["arkenv"] },
		metadata: {
			displayPath: "env.ts",
			framework: "vanilla",
			validator: "arktype",
			packageManager: "pnpm",
			importPath: "./env",
			mode: "existing",
		},
	};

	it("executes a simple plan", async () => {
		await executor.execute(defaultPlan);

		expect(mockWorkspace.mkdir).toHaveBeenCalled();
		expect(mockWorkspace.writeFile).toHaveBeenCalledWith("env.ts", "env");
		expect(mockWorkspace.execute).toHaveBeenCalledWith("pnpm", [
			"add",
			"arkenv",
		]);
		expect(mockReporter.finish).toHaveBeenCalled();
	});

	it("executes a plan for a new project (cloned template)", async () => {
		vi.mocked(mockWorkspace.readFile).mockResolvedValue(JSON.stringify({ name: "old-name" }));

		const newProjectPlan: ScaffoldingPlan = {
			...defaultPlan,
			install: { packageManager: "bun", dependencies: [] },
			metadata: {
				...defaultPlan.metadata,
				mode: "new",
				packageManager: "bun",
			},
			clone: {
				repository: "https://github.com/yamcodes/arkenv.git",
				template: "basic",
				targetName: "my-project",
			},
		};
		await executor.execute(newProjectPlan);

		// Assert git sparse-checkout and clone operations
		expect(mockWorkspace.execute).toHaveBeenCalledWith("git", [
			"clone",
			"--filter=blob:none",
			"--sparse",
			"https://github.com/yamcodes/arkenv.git",
			expect.stringContaining(".arkenv-temp"),
		]);

		expect(mockWorkspace.execute).toHaveBeenCalledWith("git", [
			"-C",
			expect.stringContaining(".arkenv-temp"),
			"sparse-checkout",
			"set",
			"examples/basic",
		]);

		// Assert file copy and cleanup
		expect(fsp.readdir).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp/examples/basic"),
		);
		expect(fsp.cp).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp/examples/basic/package.json"),
			expect.stringContaining("package.json"),
			expect.any(Object),
		);
		expect(fsp.rm).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp"),
			expect.any(Object),
		);

		// Assert package.json rewrite
		expect(mockWorkspace.writeFile).toHaveBeenCalledWith(
			expect.stringContaining("package.json"),
			expect.stringContaining('"name": "my-project"'),
		);

		// Assert dependency installation
		expect(mockWorkspace.execute).toHaveBeenCalledWith("bun", ["install"]);
	});

	it("updates tsconfig when planned", async () => {
		const plan: ScaffoldingPlan = {
			...defaultPlan,
			tsConfig: { path: "tsconfig.json", action: "strict" },
		};
		await executor.execute(plan);
		expect(mockWorkspace.updateTsConfigToStrict).toHaveBeenCalled();
	});

	it("bootstraps vite when planned", async () => {
		const plan: ScaffoldingPlan = {
			...defaultPlan,
			metadata: { ...defaultPlan.metadata, framework: "vite" },
			bootstrap: { framework: "vite", importPath: "./env" },
		};
		await executor.execute(plan);
		expect(mockWorkspace.findViteConfig).toHaveBeenCalled();
		expect(mockWorkspace.bootstrapViteConfig).toHaveBeenCalledWith(
			"vite.config.ts",
			"./env",
		);
	});

	it("appends to files when planned", async () => {
		const plan: ScaffoldingPlan = {
			...defaultPlan,
			files: [
				{ path: "vite-env.d.ts", content: "schema-path", action: "append" },
			],
			bootstrap: { framework: "vite" },
		};
		await executor.execute(plan);
		expect(mockWorkspace.safeAppend).toHaveBeenCalledWith(
			"vite-env.d.ts",
			"schema-path",
			"vite",
		);
	});

	it("installs skill when planned", async () => {
		const plan: ScaffoldingPlan = {
			...defaultPlan,
			skill: {
				dlxCommand: ["pnpm", "dlx"],
				packageName: "yamcodes/arkenv",
				isYes: true,
			},
		};
		await executor.execute(plan);
		expect(mockWorkspace.execute).toHaveBeenCalledWith("pnpm", [
			"dlx",
			"skills",
			"add",
			"yamcodes/arkenv",
			"--yes",
		]);
	});
});
