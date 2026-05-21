import fsp from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
		cwd: ".",
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
		expect(mockWorkspace.execute).toHaveBeenCalledWith(
			"pnpm",
			["add", "arkenv"],
			defaultPlan.cwd,
		);
		expect(mockReporter.finish).toHaveBeenCalled();
	});

	it("executes a plan for a new project (cloned example) into a named subdirectory", async () => {
		vi.mocked(mockWorkspace.readFile).mockResolvedValue(
			JSON.stringify({ name: "old-name", packageManager: "npm@11.9.0" }),
		);

		const newProjectPlan: ScaffoldingPlan = {
			...defaultPlan,
			install: {
				packageManager: "bun",
				dependencies: [],
				cwd: "/some/parent/my-project",
			},
			metadata: {
				...defaultPlan.metadata,
				mode: "new",
				packageManager: "bun",
			},
			clone: {
				repository: "https://github.com/yamcodes/arkenv.git",
				example: "basic",
				targetName: "my-project",
				targetDir: "/some/parent/my-project",
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

		// Assert the destination directory was created
		expect(mockWorkspace.mkdir).toHaveBeenCalledWith(
			"/some/parent/my-project",
			true,
		);

		// Assert file copy lands in the named subdirectory, not cwd
		expect(fsp.readdir).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp/examples/basic"),
		);
		expect(fsp.cp).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp/examples/basic/package.json"),
			expect.stringContaining("/some/parent/my-project/package.json"),
			expect.any(Object),
		);
		expect(fsp.rm).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp"),
			expect.any(Object),
		);

		// Assert package.json rewrite in the subdirectory
		expect(mockWorkspace.writeFile).toHaveBeenCalledWith(
			"/some/parent/my-project/package.json",
			expect.stringContaining('"name": "my-project"'),
		);
		expect(mockWorkspace.writeFile).toHaveBeenCalledWith(
			"/some/parent/my-project/package.json",
			expect.not.stringContaining("packageManager"),
		);

		// Assert dependency installation
		expect(mockWorkspace.execute).toHaveBeenCalledWith(
			"bun",
			["install"],
			"/some/parent/my-project",
		);
	});

	it("executes a plan for a new project with name '.' (cloned into cwd)", async () => {
		vi.mocked(mockWorkspace.readFile).mockResolvedValue(
			JSON.stringify({ name: "old-name" }),
		);

		const cwdBefore = process.cwd();

		const dotPlan: ScaffoldingPlan = {
			...defaultPlan,
			install: { packageManager: "npm", dependencies: [] },
			metadata: { ...defaultPlan.metadata, mode: "new", packageManager: "npm" },
			clone: {
				repository: "https://github.com/yamcodes/arkenv.git",
				example: "basic",
				targetName: "my-dir-name",
				// No targetDir — "." case, scaffold into cwd
			},
		};
		await executor.execute(dotPlan);

		// mkdir should NOT have been called with a new subdirectory path
		// (only the temp dir mkdir matters here)
		const mkdirCalls = vi.mocked(mockWorkspace.mkdir).mock.calls;
		const subDirCall = mkdirCalls.find(
			([p]) => p === `${cwdBefore}/my-dir-name`,
		);
		expect(subDirCall).toBeUndefined();

		// Copy goes into cwd, not a named subdir
		expect(fsp.cp).toHaveBeenCalledWith(
			expect.stringContaining(".arkenv-temp/examples/basic/package.json"),
			expect.stringContaining("package.json"),
			expect.any(Object),
		);
		// The destination should NOT include a /my-dir-name/ path segment
		const cpDest = vi.mocked(fsp.cp).mock.calls[0][1] as string;
		expect(cpDest).not.toContain("/my-dir-name/");
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
		expect(mockWorkspace.execute).toHaveBeenCalledWith(
			"pnpm",
			["dlx", "skills", "add", "yamcodes/arkenv", "--yes"],
			plan.cwd,
		);
	});
});
