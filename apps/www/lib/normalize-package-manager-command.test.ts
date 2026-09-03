import { describe, expect, it } from "vitest";
import { normalizePackageManagerCommand } from "./normalize-package-manager-command";

describe("normalizePackageManagerCommand", () => {
	it("expands npm i to npm install", () => {
		expect(normalizePackageManagerCommand("npm i @arkenv/core")).toBe(
			"npm install @arkenv/core",
		);
		expect(normalizePackageManagerCommand("npm i -D @arkenv/vite-plugin")).toBe(
			"npm install -D @arkenv/vite-plugin",
		);
	});

	it("rewrites bun add to bun install", () => {
		expect(normalizePackageManagerCommand("bun add @arkenv/core")).toBe(
			"bun install @arkenv/core",
		);
		expect(
			normalizePackageManagerCommand("bun add -D @arkenv/vite-plugin"),
		).toBe("bun install -D @arkenv/vite-plugin");
	});

	it("rewrites bun x to bunx", () => {
		expect(normalizePackageManagerCommand("bun x arkenv init")).toBe(
			"bunx arkenv@alpha init",
		);
	});

	it("leaves pnpm add and yarn add alone", () => {
		expect(normalizePackageManagerCommand("pnpm add @arkenv/core")).toBe(
			"pnpm add @arkenv/core",
		);
		expect(normalizePackageManagerCommand("yarn add @arkenv/core")).toBe(
			"yarn add @arkenv/core",
		);
	});

	it("tags runner commands across all package managers with alpha by default", () => {
		expect(normalizePackageManagerCommand("npx arkenv init")).toBe(
			"npx arkenv@alpha init",
		);
		expect(normalizePackageManagerCommand("pnpm dlx arkenv init")).toBe(
			"pnpm dlx arkenv@alpha init",
		);
		expect(normalizePackageManagerCommand("bun x arkenv init")).toBe(
			"bunx arkenv@alpha init",
		);
		expect(normalizePackageManagerCommand("yarn dlx arkenv init")).toBe(
			"yarn dlx arkenv@alpha init",
		);
	});

	it("preserves flags preceding arkenv token", () => {
		expect(normalizePackageManagerCommand("npx --yes arkenv init")).toBe(
			"npx --yes arkenv@alpha init",
		);
		expect(normalizePackageManagerCommand("bunx --bun arkenv init")).toBe(
			"bunx --bun arkenv@alpha init",
		);
		expect(
			normalizePackageManagerCommand("pnpm dlx --silent arkenv init"),
		).toBe("pnpm dlx --silent arkenv@alpha init");
	});

	it("rewrites pre-tagged arkenv occurrences to active release tag", () => {
		expect(normalizePackageManagerCommand("npx arkenv@latest init")).toBe(
			"npx arkenv@alpha init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@alpha init")).toBe(
			"npx arkenv@alpha init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@latest init", "rc")).toBe(
			"npx arkenv@rc init",
		);
	});

	it("removes tags when release tag is empty (GA mode)", () => {
		expect(normalizePackageManagerCommand("npx arkenv init", "")).toBe(
			"npx arkenv init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@latest init", "")).toBe(
			"npx arkenv init",
		);
		expect(normalizePackageManagerCommand("npx arkenv@alpha init", "")).toBe(
			"npx arkenv init",
		);
		expect(
			normalizePackageManagerCommand("pnpm dlx arkenv@alpha init", ""),
		).toBe("pnpm dlx arkenv init");
		expect(normalizePackageManagerCommand("bun x arkenv@latest init", "")).toBe(
			"bunx arkenv init",
		);
		expect(
			normalizePackageManagerCommand("yarn dlx arkenv@alpha init", ""),
		).toBe("yarn dlx arkenv init");
	});

	it("does not tag arkenv in package install commands", () => {
		expect(normalizePackageManagerCommand("npm install -D arkenv")).toBe(
			"npm install -D arkenv",
		);
		expect(normalizePackageManagerCommand("pnpm add -D arkenv")).toBe(
			"pnpm add -D arkenv",
		);
	});

	it("does not corrupt scoped packages like @arkenv/agent-plugin on runner lines", () => {
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

	it("normalizes runner commands inside prompt text fences", () => {
		const prompt =
			"Add ArkEnv to this repo. Run `npx arkenv init --agent`, parse the JSON on stdout, and only retry with flags from `retryWith` if a refusal is safe to bypass.";
		expect(normalizePackageManagerCommand(prompt)).toBe(
			"Add ArkEnv to this repo. Run `npx arkenv@alpha init --agent`, parse the JSON on stdout, and only retry with flags from `retryWith` if a refusal is safe to bypass.",
		);

		const initPresetPrompt =
			"Bootstrap the project with Vercel preset using `npx arkenv init --preset vercel --agent`.";
		expect(normalizePackageManagerCommand(initPresetPrompt)).toBe(
			"Bootstrap the project with Vercel preset using `npx arkenv@alpha init --preset vercel --agent`.",
		);

		// GA mode (empty tag)
		expect(normalizePackageManagerCommand(prompt, "")).toBe(prompt);
	});
});
