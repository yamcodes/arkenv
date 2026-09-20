import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAgentPrompt,
	getDocsUrl,
	getInitCommand,
	getPackageSpecifier,
	getSkillsAddSource,
	INSTALL_TAG,
	RELEASE_CONFIG,
	RELEASE_TAG,
} from "./release";

describe("release config", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("defaults RELEASE_TAG to rc and INSTALL_TAG to bare", () => {
		expect(RELEASE_TAG).toBe("rc");
		expect(INSTALL_TAG).toBe("");
	});

	it("formats package specifier with tag or bare for GA", () => {
		expect(getPackageSpecifier("arkenv", "alpha")).toBe("arkenv@alpha");
		expect(getPackageSpecifier("arkenv", "rc")).toBe("arkenv@rc");
		expect(getPackageSpecifier("arkenv", "")).toBe("arkenv");
		expect(getPackageSpecifier("arkenv", "   ")).toBe("arkenv");
		expect(getPackageSpecifier("arkenv")).toBe("arkenv");
	});

	it("always uses the short skills add source", () => {
		expect(getSkillsAddSource()).toBe("yamcodes/arkenv");
	});

	it("formats init commands across all package managers", () => {
		expect(getInitCommand("npm", "alpha")).toBe("npx arkenv@alpha init");
		expect(getInitCommand("pnpm", "alpha")).toBe("pnpm dlx arkenv@alpha init");
		expect(getInitCommand("bun", "alpha")).toBe("bunx arkenv@alpha init");
		expect(getInitCommand("yarn", "alpha")).toBe("yarn dlx arkenv@alpha init");

		// Bare / empty tag (default INSTALL_TAG)
		expect(getInitCommand("npm")).toBe("npx arkenv init");
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

	it("formats agent prompt with bare install and short skills source", () => {
		expect(getAgentPrompt("", "https://arkenv.js.org")).toBe(
			"Set up ArkEnv with `npx arkenv init --agent`. For docs/reference, start from https://arkenv.js.org/llms.txt and fetch any linked pages as markdown (append `.md`). Install the runtime engine as a dependency: `@arkenv/core` (with `arktype`) if ArkType is already in the project or there is no env validator yet; otherwise `@arkenv/standard` for use with the project's existing Standard Schema library (Zod, Valibot, etc.). Install the `arkenv` CLI as a devDependency. Use the project's package manager for installs. Wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime. When that works, suggest as a next step (do not install it yourself) that I install the ArkEnv skill with `npx skills add yamcodes/arkenv` — it teaches framework-specific env setup, keeping app code on `import { env } from \"./env\"`, and avoiding raw `process.env` / `import.meta.env`.",
		);
		expect(getAgentPrompt("rc", "https://arkenv.js.org")).toBe(
			"Set up ArkEnv with `npx arkenv@rc init --agent`. For docs/reference, start from https://arkenv.js.org/llms.txt and fetch any linked pages as markdown (append `.md`). Install the runtime engine as a dependency: `@arkenv/core` (with `arktype`) if ArkType is already in the project or there is no env validator yet; otherwise `@arkenv/standard` for use with the project's existing Standard Schema library (Zod, Valibot, etc.). Install the `arkenv` CLI as a devDependency. Use the project's package manager for installs. Wire the env schema into the app entry, start the app, and tell me when validation works from editor to runtime. When that works, suggest as a next step (do not install it yourself) that I install the ArkEnv skill with `npx skills add yamcodes/arkenv` — it teaches framework-specific env setup, keeping app code on `import { env } from \"./env\"`, and avoiding raw `process.env` / `import.meta.env`.",
		);
	});

	it("exports standard RELEASE_CONFIG with bare install and RC channel", () => {
		expect(RELEASE_CONFIG.channel).toBe("rc");
		expect(RELEASE_CONFIG.tag).toBe("rc");
		expect(RELEASE_CONFIG.packageSpecifier).toBe("arkenv");
		expect(RELEASE_CONFIG.initCommand).toBe("npx arkenv init");
		expect(RELEASE_CONFIG.agentPrompt).toContain("npx arkenv init --agent");
		expect(RELEASE_CONFIG.agentPrompt).toContain(
			"https://arkenv.js.org/llms.txt",
		);
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
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "prod.example");
		vi.stubEnv("VERCEL_URL", "preview.example");
		expect(getDocsUrl()).toBe("https://prod.example");
	});

	it("accepts arkenv.js.org from VERCEL_PROJECT_PRODUCTION_URL during RC", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "arkenv.js.org");
		vi.stubEnv("VERCEL_URL", "preview.example");
		expect(getDocsUrl()).toBe("https://arkenv.js.org");
	});

	it("accepts https://arkenv.js.org from VERCEL_PROJECT_PRODUCTION_URL during RC", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "https://arkenv.js.org");
		vi.stubEnv("VERCEL_URL", "preview.example");
		expect(getDocsUrl()).toBe("https://arkenv.js.org");
	});

	it("resolves docs URL from VERCEL_URL for preview deploys", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "arkenv-v1.vercel.app");
		expect(getDocsUrl()).toBe("https://arkenv-v1.vercel.app");
	});

	it("resolves docs URL from NEXT_PUBLIC_VERCEL_URL on client side", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "preview-client.example");
		expect(getDocsUrl()).toBe("https://preview-client.example");
	});

	it("falls back to arkenv.js.org when env is unset", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "");
		expect(getDocsUrl()).toBe("https://arkenv.js.org");
	});

	it("falls back to apex and accepts production host regardless of RELEASE_TAG", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "");
		vi.stubEnv("ARKENV_RELEASE_TAG", "");
		vi.resetModules();

		const { getDocsUrl } = await import("./release");

		expect(getDocsUrl()).toBe("https://arkenv.js.org");
		expect(
			getDocsUrl({
				NODE_ENV: "test",
				VERCEL_PROJECT_PRODUCTION_URL: "arkenv.js.org",
			}),
		).toBe("https://arkenv.js.org");
	});

	it("embeds the resolved docs URL in the agent prompt", () => {
		vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
		vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
		vi.stubEnv("VERCEL_URL", "arkenv-v1.vercel.app");
		const prompt = getAgentPrompt("");
		expect(prompt).toContain(
			"For docs/reference, start from https://arkenv-v1.vercel.app/llms.txt",
		);
		expect(prompt).toContain("npx skills add yamcodes/arkenv");
		expect(prompt).toContain("do not install it yourself");
		expect(prompt).toContain('import { env } from "./env"');
		expect(prompt).toContain("devDependency");
		expect(prompt).toContain("project's package manager for installs");
		expect(prompt).toContain("@arkenv/core");
		expect(prompt).toContain("@arkenv/standard");
		expect(prompt).toContain("(with `arktype`)");
		expect(prompt).toContain("Standard Schema library");
	});
});
