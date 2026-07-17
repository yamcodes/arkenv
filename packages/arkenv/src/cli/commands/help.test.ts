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

		// Options should be aligned based on the longest option (--host-preset <preset>) which is 22 chars
		// leftPad (2) + longest flag (22) + colGap (4) = 28 characters start index for descriptions.
		const yesOptionLog = logs.find((l) => l.includes("--yes, -y"));
		expect(yesOptionLog).toBeDefined();
		// "--yes, -y" is 9 chars. max (22) - 9 + colGap (4) = 17 spaces padding.
		expect(yesOptionLog).toBe(
			"  --yes, -y                 Skip prompts and use defaults (also passed to subprocesses)",
		);

		const exampleOptionLog = logs.find((l) => l.includes("--example, -e"));
		expect(exampleOptionLog).toBeDefined();
		// "--example, -e" is 13 chars. max (22) - 13 + colGap (4) = 13 spaces padding.
		expect(exampleOptionLog).toBe(
			"  --example, -e             Specify an example name when creating a new project",
		);

		const agentOptionLog = logs.find((l) => l.includes("--agent"));
		expect(agentOptionLog).toBeDefined();
		// "--agent" is 7 chars. max (22) - 7 + colGap (4) = 19 spaces padding.
		expect(agentOptionLog).toBe(
			"  --agent                   Enable non-interactive, machine-readable mode for AI agents. Bypasses all prompts and outputs structured JSON. Macro for --yes --quiet --json",
		);

		const noCodegenOptionLog = logs.find((l) => l.includes("--no-codegen"));
		expect(noCodegenOptionLog).toBeDefined();
		// "--no-codegen" is 12 chars. max (22) - 12 + colGap (4) = 14 spaces padding.
		expect(noCodegenOptionLog).toBe(
			"  --no-codegen              Disable automatic env.gen.ts code generation for Next.js",
		);

		const hostPresetOptionLog = logs.find((l) =>
			l.includes("--host-preset <preset>"),
		);
		expect(hostPresetOptionLog).toBeDefined();
		// "--host-preset <preset>" is 22 chars. max (22) - 22 + colGap (4) = 4 spaces padding.
		expect(hostPresetOptionLog).toBe(
			"  --host-preset <preset>    Specify a hosting provider preset (none, vercel, netlify)",
		);

		const helpOptionLog = logs.find((l) => l.includes("--help, -h"));
		expect(helpOptionLog).toBeDefined();
		// "--help, -h" is 10 chars. max (22) - 10 + colGap (4) = 16 spaces padding.
		expect(helpOptionLog).toBe(
			"  --help, -h                Show this help message",
		);
	});
});
