import { describe, expect, it } from "vitest";
import { normalizePackageManagerCommand } from "./normalize-package-manager-command";

describe("normalizePackageManagerCommand", () => {
	it("expands npm i to npm install and leaves packages bare by default", () => {
		expect(normalizePackageManagerCommand("npm i @arkenv/core")).toBe(
			"npm install @arkenv/core",
		);
		expect(normalizePackageManagerCommand("npm i -D @arkenv/vite-plugin")).toBe(
			"npm install -D @arkenv/vite-plugin",
		);
	});

	it("expands bun add to bun install and leaves packages bare by default", () => {
		expect(normalizePackageManagerCommand("bun add @arkenv/core")).toBe(
			"bun install @arkenv/core",
		);
		expect(
			normalizePackageManagerCommand("bun add -D @arkenv/vite-plugin"),
		).toBe("bun install -D @arkenv/vite-plugin");
	});

	it("normalizes bun x to bunx with bare arkenv", () => {
		expect(normalizePackageManagerCommand("bun x arkenv init")).toBe(
			"bunx arkenv init",
		);
	});

	it("keeps pnpm add and yarn add verbs", () => {
		expect(normalizePackageManagerCommand("pnpm add @arkenv/core")).toBe(
			"pnpm add @arkenv/core",
		);
		expect(normalizePackageManagerCommand("yarn add @arkenv/core")).toBe(
			"yarn add @arkenv/core",
		);
	});

	it("keeps CLI runners bare by default", () => {
		expect(normalizePackageManagerCommand("npx arkenv init")).toBe(
			"npx arkenv init",
		);
		expect(normalizePackageManagerCommand("pnpm dlx arkenv init")).toBe(
			"pnpm dlx arkenv init",
		);
		expect(normalizePackageManagerCommand("bun x arkenv init")).toBe(
			"bunx arkenv init",
		);
		expect(normalizePackageManagerCommand("yarn dlx arkenv init")).toBe(
			"yarn dlx arkenv init",
		);
	});

	it("preserves runner flags before the package", () => {
		expect(normalizePackageManagerCommand("npx --yes arkenv init")).toBe(
			"npx --yes arkenv init",
		);
		expect(normalizePackageManagerCommand("bunx --bun arkenv init")).toBe(
			"bunx --bun arkenv init",
		);
		expect(
			normalizePackageManagerCommand("pnpm dlx --silent arkenv init"),
		).toBe("pnpm dlx --silent arkenv init");
	});

	it("strips stale channel tags to bare when INSTALL_TAG is empty", () => {
		expect(normalizePackageManagerCommand("npx arkenv@latest init")).toBe(
			"npx arkenv init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@alpha init")).toBe(
			"npx arkenv init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@rc init")).toBe(
			"npx arkenv init",
		);
	});

	it("applies an explicit tag override when requested", () => {
		expect(normalizePackageManagerCommand("npx arkenv init", "rc")).toBe(
			"npx arkenv@rc init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@latest init", "rc")).toBe(
			"npx arkenv@rc init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@alpha init", "rc")).toBe(
			"npx arkenv@rc init",
		);
	});

	it("keeps bare arkenv on install lines", () => {
		expect(normalizePackageManagerCommand("npm install -D arkenv")).toBe(
			"npm install -D arkenv",
		);
		expect(normalizePackageManagerCommand("pnpm add -D arkenv")).toBe(
			"pnpm add -D arkenv",
		);
	});

	it("does not tag scoped packages on runner lines", () => {
		expect(
			normalizePackageManagerCommand("pnpm dlx @arkenv/agent-plugin init"),
		).toBe("pnpm dlx @arkenv/agent-plugin init");
		expect(
			normalizePackageManagerCommand("npx @arkenv/agent-plugin audit"),
		).toBe("npx @arkenv/agent-plugin audit");
		expect(
			normalizePackageManagerCommand("bunx @arkenv/agent-plugin init"),
		).toBe("bunx @arkenv/agent-plugin init");
	});

	it("normalizes multi-line install scripts", () => {
		expect(
			normalizePackageManagerCommand(
				"npm i @arkenv/core arktype\nnpm i -D @arkenv/vite-plugin",
			),
		).toBe(
			"npm install @arkenv/core arktype\nnpm install -D @arkenv/vite-plugin",
		);
	});

	it("rewrites scoped install tags per override", () => {
		expect(
			normalizePackageManagerCommand("npm install @arkenv/core@latest"),
		).toBe("npm install @arkenv/core");
		expect(
			normalizePackageManagerCommand("npm install @arkenv/core@latest", "rc"),
		).toBe("npm install @arkenv/core@rc");
		expect(
			normalizePackageManagerCommand("npm install @arkenv/core@alpha", ""),
		).toBe("npm install @arkenv/core");
	});

	it("rewrites arkenv runners inside prose prompts", () => {
		const prompt =
			"Add ArkEnv to this repo. Run `npx arkenv@rc init --agent`, parse the JSON on stdout, and only retry with flags from `retryWith` if a refusal is safe to bypass.";
		expect(normalizePackageManagerCommand(prompt)).toBe(
			"Add ArkEnv to this repo. Run `npx arkenv init --agent`, parse the JSON on stdout, and only retry with flags from `retryWith` if a refusal is safe to bypass.",
		);

		const initPresetPrompt =
			"Bootstrap the project with Vercel preset using `npx arkenv@rc init --preset vercel --agent`.";
		expect(normalizePackageManagerCommand(initPresetPrompt)).toBe(
			"Bootstrap the project with Vercel preset using `npx arkenv init --preset vercel --agent`.",
		);

		expect(normalizePackageManagerCommand(prompt, "rc")).toBe(
			"Add ArkEnv to this repo. Run `npx arkenv@rc init --agent`, parse the JSON on stdout, and only retry with flags from `retryWith` if a refusal is safe to bypass.",
		);
	});
});
