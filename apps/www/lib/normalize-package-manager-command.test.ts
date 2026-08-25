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
		expect(normalizePackageManagerCommand("bun x arkenv@latest init")).toBe(
			"bunx arkenv@latest init",
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
});
