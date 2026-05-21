import pc from "picocolors";
import { describe, expect, it, vi } from "vitest";
import type { LoggerPort } from "@/shared/ports";
import { version } from "../../../package.json";
import { HelpUseCase } from "./help";

describe("HelpUseCase", () => {
	it("should display the help message with dynamic column alignment", async () => {
		const logs: string[] = [];
		const logger = {
			log: vi.fn().mockImplementation((msg: string) => {
				logs.push(msg);
			}),
		} as unknown as LoggerPort;

		const useCase = new HelpUseCase(logger);
		await useCase.execute();

		expect(logger.log).toHaveBeenCalled();
		expect(logs[0]).toBe(`ArkEnv CLI v${version}`);
		expect(logs[1]).toBe(`\n${pc.bold("Usage:")}`);

		// Commands should be listed and formatted properly
		const initCommandLog = logs.find((l) =>
			l.includes("arkenv init [project-name]"),
		);
		expect(initCommandLog).toBeDefined();
		expect(initCommandLog).toBe(
			"  arkenv init [project-name]    Set up ArkEnv in your project",
		);

		// Options should be aligned based on the longest option (--example, -e) which is 13 chars
		// leftPad (2) + longest flag (13) + colGap (4) = 19 characters start index for descriptions.
		const yesOptionLog = logs.find((l) => l.includes("--yes, -y"));
		expect(yesOptionLog).toBeDefined();
		// "--yes, -y" is 9 chars. max (13) - 9 + colGap (4) = 8 spaces padding.
		// "  " (2) + "--yes, -y" (9) + "        " (8) + "Skip prompts..."
		expect(yesOptionLog).toBe(
			"  --yes, -y        Skip prompts and use defaults (also passed to skill processes)",
		);

		const exampleOptionLog = logs.find((l) => l.includes("--example, -e"));
		expect(exampleOptionLog).toBeDefined();
		// "--example, -e" is 13 chars. max (13) - 13 + colGap (4) = 4 spaces padding.
		// "  " (2) + "--example, -e" (13) + "    " (4) + "Specify..."
		expect(exampleOptionLog).toBe(
			"  --example, -e    Specify an example ID to scaffold from (when creating a new project)",
		);

		const helpOptionLog = logs.find((l) => l.includes("--help, -h"));
		expect(helpOptionLog).toBeDefined();
		// "--help, -h" is 10 chars. max (13) - 10 + colGap (4) = 7 spaces padding.
		expect(helpOptionLog).toBe("  --help, -h       Show this help message");
	});
});
