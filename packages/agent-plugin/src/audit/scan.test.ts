import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { auditProject, auditSource } from "./scan";

const ROOT = "/repo";

describe("auditSource", () => {
	it("flags raw process.env access outside the env module", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/app.ts"),
			"export const url = process.env.DATABASE_URL;\n",
		);
		expect(diagnostics.some((d) => d.ruleId === "unvalidated-access")).toBe(
			true,
		);
		const hit = diagnostics.find((d) => d.ruleId === "unvalidated-access");
		expect(hit?.file).toBe(path.join("src", "app.ts"));
		expect(hit?.line).toBe(1);
		expect(hit?.suggestedFix).toContain("env.DATABASE_URL");
	});

	it("flags import.meta.env access outside the env module", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/main.ts"),
			"export const url = import.meta.env.VITE_API_URL;\n",
		);
		expect(diagnostics.some((d) => d.ruleId === "unvalidated-access")).toBe(
			true,
		);
	});

	it("does not flag process.env inside the canonical env module", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/env.ts"),
			`import arkenv from "@arkenv/core";
export const env = arkenv({
  DATABASE_URL: "string",
});
void process.env.DATABASE_URL;
`,
		);
		expect(
			diagnostics.filter((d) => d.ruleId === "unvalidated-access"),
		).toEqual([]);
	});

	it('does not flag valid import { env } from "./env" on the server', () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/server.ts"),
			`import { env } from "./env";
export const url = env.DATABASE_URL;
`,
		);
		expect(diagnostics).toEqual([]);
	});

	it("flags server secrets accessed in client components", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "app/components/header.tsx"),
			`"use client";
import { env } from "./env";
export function Header() {
  return env.DATABASE_URL;
}
`,
		);
		expect(diagnostics.some((d) => d.ruleId === "secret-leak")).toBe(true);
		expect(
			diagnostics.find((d) => d.ruleId === "secret-leak")?.message,
		).toContain("DATABASE_URL");
	});

	it("does not flag public-prefixed keys in client components", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "app/components/banner.tsx"),
			`"use client";
import { env } from "./env";
export function Banner() {
  return env.NEXT_PUBLIC_SITE_URL;
}
`,
		);
		expect(diagnostics.filter((d) => d.ruleId === "secret-leak")).toEqual([]);
		expect(
			diagnostics.filter((d) => d.ruleId === "unvalidated-access"),
		).toEqual([]);
	});

	it("flags public prefixes on secret-looking keys", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/lib.ts"),
			"export const leaked = process.env.NEXT_PUBLIC_DATABASE_URL;\n",
		);
		expect(diagnostics.some((d) => d.ruleId === "prefix-violation")).toBe(true);
	});

	it("flags public prefixes on secret-looking keys in env schemas", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/env.ts"),
			`export const env = arkenv({
  NEXT_PUBLIC_DATABASE_URL: "string",
});
`,
		);
		expect(diagnostics.some((d) => d.ruleId === "prefix-violation")).toBe(true);
	});

	it("flags leftover v0 ambient ProcessEnv augmentations", () => {
		const diagnostics = auditSource(
			ROOT,
			path.join(ROOT, "src/env.d.ts"),
			`type ProcessEnvAugmented = import("@arkenv/nextjs").ProcessEnvAugmented<typeof import("./env").env>;
declare namespace NodeJS {
  interface ProcessEnv extends ProcessEnvAugmented {}
}
`,
		);
		expect(diagnostics.some((d) => d.ruleId === "legacy-ambient")).toBe(true);
	});
});

describe("auditProject", () => {
	it("walks a temp tree and reports process.env bypasses", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "arkenv-audit-"));
		await mkdir(path.join(dir, "src"));
		await writeFile(
			path.join(dir, "src/env.ts"),
			`export const env = { DATABASE_URL: "x" };\n`,
		);
		await writeFile(
			path.join(dir, "src/app.ts"),
			"export const url = process.env.DATABASE_URL;\n",
		);
		const report = await auditProject(dir);
		expect(
			report.diagnostics.some(
				(d) => d.ruleId === "unvalidated-access" && d.file.includes("app.ts"),
			),
		).toBe(true);
		expect(report.diagnostics.some((d) => d.file.includes("env.ts"))).toBe(
			false,
		);
	});
});
