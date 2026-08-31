import { describe, expect, it } from "vitest";
import {
	getAgentPrompt,
	getInitCommand,
	getPackageSpecifier,
	RELEASE_CONFIG,
	RELEASE_TAG,
} from "./release";

describe("release config", () => {
	it("defaults RELEASE_TAG to alpha", () => {
		expect(RELEASE_TAG).toBe("alpha");
	});

	it("formats package specifier with tag or bare for GA", () => {
		expect(getPackageSpecifier("arkenv", "alpha")).toBe("arkenv@alpha");
		expect(getPackageSpecifier("arkenv", "rc")).toBe("arkenv@rc");
		expect(getPackageSpecifier("arkenv", "")).toBe("arkenv");
		expect(getPackageSpecifier("arkenv", "   ")).toBe("arkenv");
	});

	it("formats init commands across all package managers", () => {
		expect(getInitCommand("npm", "alpha")).toBe("npx arkenv@alpha init");
		expect(getInitCommand("pnpm", "alpha")).toBe("pnpm dlx arkenv@alpha init");
		expect(getInitCommand("bun", "alpha")).toBe("bunx arkenv@alpha init");
		expect(getInitCommand("yarn", "alpha")).toBe("yarn dlx arkenv@alpha init");

		// GA / empty tag
		expect(getInitCommand("npm", "")).toBe("npx arkenv init");
		expect(getInitCommand("pnpm", "")).toBe("pnpm dlx arkenv init");
		expect(getInitCommand("bun", "")).toBe("bunx arkenv init");
		expect(getInitCommand("yarn", "")).toBe("yarn dlx arkenv init");
	});

	it("formats init commands with custom args", () => {
		expect(getInitCommand("npm", "alpha", "init --agent")).toBe(
			"npx arkenv@alpha init --agent",
		);
		expect(getInitCommand("pnpm", "alpha", "check --env-file .env")).toBe(
			"pnpm dlx arkenv@alpha check --env-file .env",
		);
		expect(getInitCommand("bun", "", "init --agent")).toBe(
			"bunx arkenv init --agent",
		);
	});

	it("formats agent prompt with active release tag", () => {
		expect(getAgentPrompt("alpha")).toBe(
			"Set up ArkEnv with `npx arkenv@alpha init --agent`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.",
		);
		expect(getAgentPrompt("")).toBe(
			"Set up ArkEnv with `npx arkenv init --agent`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.",
		);
	});

	it("exports standard RELEASE_CONFIG", () => {
		expect(RELEASE_CONFIG.channel).toBe(RELEASE_TAG);
		expect(RELEASE_CONFIG.tag).toBe(RELEASE_TAG);
		expect(RELEASE_CONFIG.packageSpecifier).toBe(
			RELEASE_TAG ? `arkenv@${RELEASE_TAG}` : "arkenv",
		);
		expect(RELEASE_CONFIG.initCommand).toBe(
			RELEASE_TAG ? `npx arkenv@${RELEASE_TAG} init` : "npx arkenv init",
		);
		expect(RELEASE_CONFIG.agentPrompt).toBe(getAgentPrompt(RELEASE_TAG));
	});
});
