import { confirm } from "@clack/prompts";
import pc from "picocolors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEnvExampleStep } from "./env-example";

vi.mock("@clack/prompts", () => ({
	confirm: vi.fn(),
	isCancel: vi.fn().mockReturnValue(false),
}));

describe("useEnvExampleStep", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(confirm).mockResolvedValue(true);
	});

	it("should pluralize correctly for 1 key in .env.example", async () => {
		vi.mocked(confirm).mockResolvedValue(true);
		await useEnvExampleStep({
			detectedKeys: ["API_KEY"],
			keysSource: ".env.example",
		});

		expect(confirm).toHaveBeenCalledWith(
			expect.objectContaining({
				message: `Detected ${pc.cyan(".env.example")} with 1 key. Use it for your schema?`,
			}),
		);
	});

	it("should pluralize correctly for multiple keys in .env.example", async () => {
		vi.mocked(confirm).mockResolvedValue(true);
		await useEnvExampleStep({
			detectedKeys: ["API_KEY", "DEBUG"],
			keysSource: ".env.example",
		});

		expect(confirm).toHaveBeenCalledWith(
			expect.objectContaining({
				message: `Detected ${pc.cyan(".env.example")} with 2 keys. Use them for your schema?`,
			}),
		);
	});

	it("should pluralize correctly for 1 environment variable from project", async () => {
		vi.mocked(confirm).mockResolvedValue(true);
		await useEnvExampleStep({
			detectedKeys: ["API_KEY"],
			keysSource: "project",
		});

		expect(confirm).toHaveBeenCalledWith(
			expect.objectContaining({
				message:
					"Detected 1 environment variable used in your project. Use it for your schema?",
			}),
		);
	});

	it("should pluralize correctly for multiple environment variables from project", async () => {
		vi.mocked(confirm).mockResolvedValue(true);
		await useEnvExampleStep({
			detectedKeys: ["API_KEY", "DEBUG"],
			keysSource: "project",
		});

		expect(confirm).toHaveBeenCalledWith(
			expect.objectContaining({
				message:
					"Detected 2 environment variables used in your project. Use them for your schema?",
			}),
		);
	});

	it("should return false if no keys are detected", async () => {
		const result = await useEnvExampleStep({ detectedKeys: [] });
		expect(result).toBe(false);
		expect(confirm).not.toHaveBeenCalled();
	});

	it("should return false if detectedKeys is null", async () => {
		const result = await useEnvExampleStep({ detectedKeys: null });
		expect(result).toBe(false);
		expect(confirm).not.toHaveBeenCalled();
	});
});
