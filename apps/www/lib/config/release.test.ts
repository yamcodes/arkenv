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
			'Set up ArkEnv with `npx arkenv@alpha init --agent`. Start from https://arkenv.js.org/llms.txt and fetch any linked pages as markdown (append `.md`). Install the runtime validation engine (`@arkenv/core` or `@arkenv/standard`) as a dependency, and the `arkenv` CLI as a devDependency. Use the same package manager context as `npx arkenv@alpha init --agent` for all installations. Wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime. When that works, suggest as a next step (do not install it yourself) that I install the ArkEnv skill with `npx skills add yamcodes/arkenv` — it teaches framework-specific env setup, keeping app code on `import { env } from "./env"`, and avoiding raw `process.env` / `import.meta.env`.',
		);
		expect(getAgentPrompt("", "https://arkenv.js.org")).toBe(
			'Set up ArkEnv with `npx arkenv init --agent`. Start from https://arkenv.js.org/llms.txt and fetch any linked pages as markdown (append `.md`). Install the runtime validation engine (`@arkenv/core` or `@arkenv/standard`) as a dependency, and the `arkenv` CLI as a devDependency. Use the same package manager context as `npx arkenv init --agent` for all installations. Wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime. When that works, suggest as a next step (do not install it yourself) that I install the ArkEnv skill with `npx skills add yamcodes/arkenv` — it teaches framework-specific env setup, keeping app code on `import { env } from "./env"`, and avoiding raw `process.env` / `import.meta.env`.',
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
		expect(RELEASE_CONFIG.agentPrompt).toContain("/llms.txt");
		expect(RELEASE_CONFIG.agentPrompt).toContain(
			"suggest as a next step (do not install it yourself)",
		);
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

	it("prepends https:// to bare-hostname NEXT_PUBLIC_SITE_URL", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "arkenv.js.org");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "prod.example");
		vi.stubEnv("VERCEL_URL", "preview.example");
		expect(getDocsUrl()).toBe("https://arkenv.js.org");
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
		expect(prompt).toContain(
			"Start from https://arkenv-v1.vercel.app/llms.txt",
		);
		expect(prompt).toContain("npx skills add yamcodes/arkenv");
		expect(prompt).toContain("do not install it yourself");
		expect(prompt).toContain('import { env } from "./env"');
		expect(prompt).toContain("devDependency");
		expect(prompt).toContain("same package manager context");
		expect(prompt).toContain("@arkenv/core");
		expect(prompt).toContain("@arkenv/standard");
	});
});
