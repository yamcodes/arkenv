import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as prompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPromptWizard } from "./prompts";

const { mockExistsSync } = vi.hoisted(() => ({
	mockExistsSync: vi.fn().mockReturnValue(false),
}));

vi.mock("node:fs", () => ({
	default: {
		existsSync: mockExistsSync,
	},
	existsSync: mockExistsSync,
}));

vi.mock("@clack/prompts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@clack/prompts")>();
	return {
		...actual,
		group: vi.fn(),
		confirm: vi.fn(),
		select: vi.fn(),
		text: vi.fn(),
		cancel: vi.fn(),
		isCancel: vi.fn().mockReturnValue(false),
	};
});

describe("runPromptWizard", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "prompts-test-"));
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
		vi.resetAllMocks();
		mockExistsSync.mockReturnValue(false);
		vi.mocked(prompts.isCancel).mockReturnValue(false);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	it("should detect .env.example keys in isYes mode", async () => {
		const result = await runPromptWizard({ envKeys: ["API_KEY"] }, true);

		expect(result?.envKeys).toEqual(["API_KEY"]);
	});

	it("should include bunFeatures in isYes mode if detected", async () => {
		const result = await runPromptWizard(
			{ framework: "bun-fullstack", bunFeatures: ["serve"] },
			true,
		);

		expect(result?.framework).toBe("bun-fullstack");
		expect(result?.bunFeatures).toEqual(["serve"]);
	});

	it("should include bunFeatures if user selects them in wizard", async () => {
		vi.mocked(prompts.select).mockResolvedValueOnce("bun-fullstack"); // framework
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // bunBuild
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // useDefaultPath
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // installTypeDefinitions
		vi.mocked(prompts.select).mockResolvedValueOnce("arktype"); // validator
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // useEnvExample

		const result = await runPromptWizard({ framework: "bun-fullstack" });

		expect(result?.framework).toBe("bun-fullstack");
		expect(result?.bunFeatures).toEqual(["serve", "build"]);
	});

	it("should include envKeys if user accepts prompt", async () => {
		vi.mocked(prompts.select).mockResolvedValueOnce("vanilla"); // framework
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // useDefaultPath
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // installTypeDefinitions
		vi.mocked(prompts.select).mockResolvedValueOnce("arktype"); // validator
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // useEnvExample

		const result = await runPromptWizard({ envKeys: ["API_KEY"] });

		expect(result?.envKeys).toEqual(["API_KEY"]);
	});

	it("should NOT include envKeys if user declines prompt", async () => {
		mockExistsSync.mockReturnValue(false);
		vi.mocked(prompts.select).mockResolvedValueOnce("vanilla"); // framework
		vi.mocked(prompts.confirm).mockResolvedValueOnce(true); // useDefaultPath
		vi.mocked(prompts.select).mockResolvedValueOnce("arktype"); // validator
		vi.mocked(prompts.confirm).mockResolvedValueOnce(false); // useEnvExample

		const result = await runPromptWizard({ envKeys: ["API_KEY"] });

		expect(result?.envKeys).toBeUndefined();
	});
	it("should abort immediately if user selects No (abort) on overwrite prompt", async () => {
		mockExistsSync.mockReturnValue(true);
		vi.mocked(prompts.confirm).mockResolvedValueOnce(false);

		const result = await runPromptWizard();

		expect(result).toBeNull();
		expect(prompts.select).not.toHaveBeenCalled();
		expect(prompts.cancel).toHaveBeenCalledWith("Operation cancelled");
	});

	it("should abort immediately if user cancels a prompt (Ctrl+C)", async () => {
		const cancelSymbol = Symbol("clack-cancel");
		vi.mocked(prompts.isCancel).mockImplementation((v) => v === cancelSymbol);
		mockExistsSync.mockReturnValue(false);
		vi.mocked(prompts.select).mockResolvedValueOnce(cancelSymbol); // framework

		const result = await runPromptWizard();

		expect(result).toBeNull();
		expect(prompts.confirm).not.toHaveBeenCalled();
		expect(prompts.cancel).toHaveBeenCalledWith("Operation cancelled");
	});

	it("should reject unknown example defaults", async () => {
		await expect(
			runPromptWizard(
				{
					mode: "new",
					example: "with-vite-recat",
					examples: [
						{
							id: "basic",
							name: "Basic",
							description: "A minimal ArkEnv setup in Node.js",
							framework: "vanilla",
						},
					],
					name: "example",
				},
				true,
			),
		).rejects.toThrow("Unknown example with-vite-recat");
	});

	it("should handle new project wizard with default name", async () => {
		const mockCwd = path.join(os.tmpdir(), "my-cool-project");
		vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

		const examples = [
			{
				id: "basic",
				name: "Basic",
				description: "A minimal ArkEnv setup in Node.js",
				framework: "vanilla" as const,
			},
		];

		vi.mocked(prompts.text).mockResolvedValueOnce(""); // Empty input, should use placeholder/default
		vi.mocked(prompts.select).mockResolvedValueOnce("basic");

		const result = await runPromptWizard({
			mode: "new",
			examples,
		});

		expect(result?.mode).toBe("new");
		expect(result?.name).toBe("arkenv-project");
		expect(result?.example).toBe("basic");
		expect(prompts.text).toHaveBeenCalledWith(
			expect.objectContaining({
				defaultValue: "arkenv-project",
				placeholder: "arkenv-project",
			}),
		);
	});

	it("should preserve '.' as the project name when the user explicitly types it", async () => {
		const mockCwd = path.join(os.tmpdir(), "my-project");
		vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

		const examples = [
			{
				id: "basic",
				name: "Basic",
				description: "A minimal ArkEnv setup in Node.js",
				framework: "vanilla" as const,
			},
		];

		vi.mocked(prompts.text).mockResolvedValueOnce("."); // User types "."
		vi.mocked(prompts.select).mockResolvedValueOnce("basic");

		const result = await runPromptWizard({
			mode: "new",
			examples,
		});

		// "." should be preserved; normalization is the caller's responsibility.
		expect(result?.name).toBe(".");
	});

	it("should normalize inputs resolving to the current directory (like './') to '.'", async () => {
		const mockCwd = path.join(os.tmpdir(), "my-project");
		vi.spyOn(process, "cwd").mockReturnValue(mockCwd);

		const examples = [
			{
				id: "basic",
				name: "Basic",
				description: "A minimal ArkEnv setup in Node.js",
				framework: "vanilla" as const,
			},
		];

		vi.mocked(prompts.text).mockResolvedValueOnce("./"); // User types "./"
		vi.mocked(prompts.select).mockResolvedValueOnce("basic");

		const result = await runPromptWizard({
			mode: "new",
			examples,
		});

		expect(result?.name).toBe(".");
	});
});
