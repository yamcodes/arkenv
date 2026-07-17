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

		// Options should be aligned based on the longest option (--host-preset, -p <preset>) which is 26 chars
		// leftPad (2) + longest flag (26) + colGap (4) = 32 characters start index for descriptions.
		const yesOptionLog = logs.find((l) => l.includes("--yes, -y"));
		expect(yesOptionLog).toBeDefined();
		// "--yes, -y" is 9 chars. max (26) - 9 + colGap (4) = 21 spaces padding.
		expect(yesOptionLog).toBe(
			"  --yes, -y                     Skip prompts and use defaults (also passed to subprocesses)",
		);

		const exampleOptionLog = logs.find((l) => l.includes("--example, -e"));
		expect(exampleOptionLog).toBeDefined();
		// "--example, -e" is 13 chars. max (26) - 13 + colGap (4) = 17 spaces padding.
		expect(exampleOptionLog).toBe(
			"  --example, -e                 Specify an example name when creating a new project",
		);

		const noCodegenOptionLog = logs.find((l) => l.includes("--no-codegen, -C"));
		expect(noCodegenOptionLog).toBeDefined();
		// "--no-codegen, -C" is 16 chars. max (26) - 16 + colGap (4) = 14 spaces padding.
		expect(noCodegenOptionLog).toBe(
			"  --no-codegen, -C              Disable automatic env.gen.ts code generation for Next.js",
		);

		const hostPresetOptionLog = logs.find((l) =>
			l.includes("--host-preset, -p <preset>"),
		);
		expect(hostPresetOptionLog).toBeDefined();
		// "--host-preset, -p <preset>" is 26 chars. max (26) - 26 + colGap (4) = 4 spaces padding.
		expect(hostPresetOptionLog).toBe(
			"  --host-preset, -p <preset>    Specify a hosting provider preset (none, vercel, netlify)",
		);

		const helpOptionLog = logs.find((l) => l.includes("--help, -h"));
		expect(helpOptionLog).toBeDefined();
		// "--help, -h" is 10 chars. max (26) - 10 + colGap (4) = 20 spaces padding.
		expect(helpOptionLog).toBe(
			"  --help, -h                    Show this help message",
		);
	});
});
