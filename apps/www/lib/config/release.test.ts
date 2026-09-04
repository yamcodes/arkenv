import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAgentPrompt,
	getDocsUrl,
	getInitCommand,
	getPackageSpecifier,
	RELEASE_CONFIG,
	RELEASE_TAG,
} from "./release";

describe("release config", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

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
		expect(getAgentPrompt("alpha", "https://arkenv.js.org")).toBe(
			'Set up ArkEnv with `npx arkenv@alpha init --agent`. Use docs only at https://arkenv.js.org. If the ArkEnv skill is missing, install it with `npx skills add yamcodes/arkenv`. Prefer `@arkenv/core` / `@arkenv/standard` over legacy `import from "arkenv"`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.',
		);
		expect(getAgentPrompt("", "https://arkenv.js.org")).toBe(
			'Set up ArkEnv with `npx arkenv init --agent`. Use docs only at https://arkenv.js.org. If the ArkEnv skill is missing, install it with `npx skills add yamcodes/arkenv`. Prefer `@arkenv/core` / `@arkenv/standard` over legacy `import from "arkenv"`. Install any missing dependencies, wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime.',
		);
	});

	it("exports standard RELEASE_CONFIG", () => {
		expect(RELEASE_CONFIG.channel).toBe("alpha");
		expect(RELEASE_CONFIG.tag).toBe("alpha");
		expect(RELEASE_CONFIG.packageSpecifier).toBe("arkenv@alpha");
		expect(RELEASE_CONFIG.initCommand).toBe("npx arkenv@alpha init");
		expect(RELEASE_CONFIG.agentPrompt).toContain(
			"npx arkenv@alpha init --agent",
		);
		expect(RELEASE_CONFIG.agentPrompt).toContain("Use docs only at ");
		expect(RELEASE_CONFIG.agentPrompt).toContain(
			"npx skills add yamcodes/arkenv",
		);
		expect(RELEASE_CONFIG.agentPrompt).toContain("@arkenv/core");
	});

	it("resolves docs URL from NEXT_PUBLIC_SITE_URL first", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://custom.example/");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "prod.example");
		vi.stubEnv("VERCEL_URL", "preview.example");
		expect(getDocsUrl()).toBe("https://custom.example");
	});

	it("resolves docs URL from VERCEL_PROJECT_PRODUCTION_URL next", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "arkenv.js.org");
		vi.stubEnv("VERCEL_URL", "arkenv-v1.vercel.app");
		expect(getDocsUrl()).toBe("https://arkenv.js.org");
	});

	it("resolves docs URL from VERCEL_URL for preview deploys", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "arkenv-v1.vercel.app");
		expect(getDocsUrl()).toBe("https://arkenv-v1.vercel.app");
	});

	it("falls back to arkenv.js.org when env is unset", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "");
		expect(getDocsUrl()).toBe("https://arkenv.js.org");
	});

	it("embeds the resolved docs URL in the agent prompt", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "arkenv-v1.vercel.app");
		const prompt = getAgentPrompt("alpha");
		expect(prompt).toContain("Use docs only at https://arkenv-v1.vercel.app.");
		expect(prompt).toContain("`npx skills add yamcodes/arkenv`");
		expect(prompt).toContain("@arkenv/core");
		expect(prompt).toContain("@arkenv/standard");
	});
});
