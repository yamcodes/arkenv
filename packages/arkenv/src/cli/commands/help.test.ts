import pc from "picocolors";
import { describe, expect, it, vi } from "vitest";
import type { LoggerPort } from "@/shared/ports";
import { version } from "../../../package.json";
import { HelpUseCase } from "./help";

describe("HelpUseCase", () => {
	it("should display the help message with Global and init option sections", async () => {
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

		const addCommandLog = logs.find((l) =>
			l.includes("arkenv add host [provider]"),
		);
		expect(addCommandLog).toBeDefined();
		expect(addCommandLog).toBe(
			"  arkenv add host [provider]    Add hosting provider preset (vercel, netlify, cloudflare, railway, render, fly) to schema",
		);

		const globalHeaderIndex = logs.findIndex((l) =>
			l.includes(pc.bold("Global options:")),
		);
		const initHeaderIndex = logs.findIndex((l) =>
			l.includes(pc.bold("init options:")),
		);
		expect(globalHeaderIndex).toBeGreaterThan(-1);
		expect(initHeaderIndex).toBeGreaterThan(globalHeaderIndex);

		// Global options align on the longest flag in that section (--quiet, -q = 11 chars)
		const yesOptionLog = logs.find((l) => l.includes("--yes, -y"));
		expect(yesOptionLog).toBeDefined();
		// "--yes, -y" is 9 chars. max (11) - 9 + colGap (4) = 6 spaces padding.
		expect(yesOptionLog).toBe(
			"  --yes, -y      Skip prompts and use defaults (also passed to subprocesses)",
		);
		expect(logs.indexOf(yesOptionLog as string)).toBeGreaterThan(
			globalHeaderIndex,
		);
		expect(logs.indexOf(yesOptionLog as string)).toBeLessThan(initHeaderIndex);

		const agentOptionLog = logs.find((l) => l.includes("--agent"));
		expect(agentOptionLog).toBeDefined();
		// "--agent" is 7 chars. max (11) - 7 + colGap (4) = 8 spaces padding.
		expect(agentOptionLog).toBe(
			"  --agent        Enable non-interactive, machine-readable mode for AI agents. Bypasses all prompts and outputs structured JSON. Macro for --yes --quiet --json",
		);
		expect(logs.indexOf(agentOptionLog as string)).toBeLessThan(
			initHeaderIndex,
		);

		const helpOptionLog = logs.find((l) => l.includes("--help, -h"));
		expect(helpOptionLog).toBeDefined();
		// "--help, -h" is 10 chars. max (11) - 10 + colGap (4) = 5 spaces padding.
		expect(helpOptionLog).toBe("  --help, -h     Show this help message");
		expect(logs.indexOf(helpOptionLog as string)).toBeLessThan(initHeaderIndex);

		// Init options align on --host-preset, -H <preset> (26 chars) and must not appear under Global
		const exampleOptionLog = logs.find((l) => l.includes("--example"));
		expect(exampleOptionLog).toBeDefined();
		// "--example" is 9 chars. max (26) - 9 + colGap (4) = 21 spaces padding.
		expect(exampleOptionLog).toBe(
			"  --example                     Specify an example name when creating a new project",
		);
		expect(logs.indexOf(exampleOptionLog as string)).toBeGreaterThan(
			initHeaderIndex,
		);

		const noCodegenOptionLog = logs.find((l) => l.includes("--no-codegen"));
		expect(noCodegenOptionLog).toBeDefined();
		// "--no-codegen" is 12 chars. max (26) - 12 + colGap (4) = 18 spaces padding.
		expect(noCodegenOptionLog).toBe(
			"  --no-codegen                  Disable automatic env.gen.ts code generation for Next.js",
		);
		expect(logs.indexOf(noCodegenOptionLog as string)).toBeGreaterThan(
			initHeaderIndex,
		);

		const hostPresetOptionLog = logs.find((l) =>
			l.includes("--host-preset, -H <preset>"),
		);
		expect(hostPresetOptionLog).toBeDefined();
		// "--host-preset, -H <preset>" is 26 chars. max (26) - 26 + colGap (4) = 4 spaces padding.
		expect(hostPresetOptionLog).toBe(
			"  --host-preset, -H <preset>    Specify a hosting provider preset (none, vercel, netlify, cloudflare, railway, render, fly)",
		);
		expect(logs.indexOf(hostPresetOptionLog as string)).toBeGreaterThan(
			initHeaderIndex,
		);

		const forceOptionLog = logs.find((l) => l.includes("--force, -f"));
		expect(forceOptionLog).toBeDefined();
		expect(logs.indexOf(forceOptionLog as string)).toBeGreaterThan(
			initHeaderIndex,
		);
	});
});
