import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as prompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPromptWizard } from "./prompts";

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
			{ framework: "bun", bunFeatures: ["serve"] },
			true,
		);

		expect(result?.framework).toBe("bun");
		expect(result?.bunFeatures).toEqual(["serve"]);
	});

	it("should include bunFeatures if user selects them in wizard", async () => {
		vi.mocked(prompts.group).mockResolvedValue({
			overwrite: true,
			framework: "bun",
			bunFeatures: ["serve", "build"],
			validator: "arktype",
			useEnvExample: true,
			useDefaultPath: true,
		});

		const result = await runPromptWizard({ framework: "bun" });

		expect(result?.framework).toBe("bun");
		expect(result?.bunFeatures).toEqual(["serve", "build"]);
	});

	it("should include envKeys if user accepts prompt", async () => {
		vi.mocked(prompts.group).mockResolvedValue({
			overwrite: true,
			framework: "node",
			validator: "arktype",
			useEnvExample: true,
			useDefaultPath: true,
		});

		const result = await runPromptWizard({ envKeys: ["API_KEY"] });

		expect(result?.envKeys).toEqual(["API_KEY"]);
	});

	it("should NOT include envKeys if user declines prompt", async () => {
		vi.mocked(prompts.group).mockResolvedValue({
			overwrite: true,
			framework: "node",
			validator: "arktype",
			useEnvExample: false,
			useDefaultPath: true,
		});

		const result = await runPromptWizard({ envKeys: ["API_KEY"] });

		expect(result?.envKeys).toBeUndefined();
	});
});
