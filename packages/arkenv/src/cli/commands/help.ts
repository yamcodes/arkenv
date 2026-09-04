import pc from "picocolors";
import type { LoggerPort } from "@/shared/ports";
import { version } from "../../../package.json";

type HelpItem = {
	left: string;
	right: string;
};

/**
 * Formats a list of key-value pairs (like options or commands) into columns,
 * aligning the right column based on the longest left column value.
 */
function formatColumns(items: HelpItem[], leftPad = 2, colGap = 4): string[] {
	const maxLeftLen = Math.max(...items.map((item) => item.left.length), 0);
	const pad = " ".repeat(leftPad);
	return items.map((item) => {
		const rightPad = " ".repeat(maxLeftLen - item.left.length + colGap);
		return `${pad}${item.left}${rightPad}${item.right}`;
	});
}

/**
 * Use case for displaying the CLI help message.
 */
export class HelpUseCase {
	/**
	 * Creates the help use case with the logger used for CLI output.
	 */
	constructor(private readonly logger: LoggerPort) {}

	/**
	 * Writes the CLI help text to the configured logger.
	 */
	async execute() {
		const commands: HelpItem[] = [
			{
				left: "arkenv init [project-name]",
				right: "Set up ArkEnv in your project",
			},
			{
				left: "arkenv check",
				right: "Validate the environment against the schema",
			},
		];

		const globalOptions: HelpItem[] = [
			{
				left: "--yes, -y",
				right: "Skip prompts and use defaults (also passed to subprocesses)",
			},
			{
				left: "--quiet, -q",
				right: "Quiet mode: Suppress output, capture logs on failure",
			},
			{
				left: "--json, -j",
				right: "Output structured JSON to stdout",
			},
			{
				left: "--agent",
				right:
					"Enable non-interactive, machine-readable mode for AI agents. Bypasses all prompts and outputs structured JSON. Macro for --yes --quiet --json",
			},
			{
				left: "--help, -h",
				right: "Show this help message",
			},
		];

		const initOptions: HelpItem[] = [
			{
				left: "--example",
				right: "Specify an example name when creating a new project",
			},
			{
				left: "--force, -f",
				right:
					"Bypass technical requirement checks and dirty git working tree check, then force scaffolding",
			},
			{
				left: "--no-codegen",
				right: "Disable automatic env.gen.ts code generation for Next.js",
			},
			{
				left: "--preset, -P <preset>",
				right:
					"Specify a hosting provider preset (none, vercel, netlify, cloudflare, railway, render, fly)",
			},
		];

		const checkOptions: HelpItem[] = [
			{
				left: "--schema, -s <path>",
				right:
					"Path to schema file (overrides package.json or convention discovery)",
			},
			{
				left: "--env-file <file>",
				right:
					"Path to .env file to load (repeatable; merged in order over process.env)",
			},
			{
				left: "--verify-example [file]",
				right:
					"Verify that all declared schema keys are present in .env.example (or custom file)",
			},
		];

		this.logger.log(`ArkEnv CLI v${version}`);
		this.logger.log(`\n${pc.bold("Usage:")}`);
		for (const line of formatColumns(commands)) {
			this.logger.log(line);
		}
		this.logger.log(`\n${pc.bold("Global options:")}`);
		for (const line of formatColumns(globalOptions)) {
			this.logger.log(line);
		}
		this.logger.log(`\n${pc.bold("init options:")}`);
		for (const line of formatColumns(initOptions)) {
			this.logger.log(line);
		}
		this.logger.log(`\n${pc.bold("check options:")}`);
		for (const line of formatColumns(checkOptions)) {
			this.logger.log(line);
		}
	}
}
