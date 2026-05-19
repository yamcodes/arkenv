import { describe, expect, it } from "vitest";
import type { ScaffoldingPlan } from "./plan";
import { getUsageInstructions } from "./utils";

describe("scaffold utils", () => {
	describe("getUsageInstructions", () => {
		const basePlan: ScaffoldingPlan = {
			files: [],
			metadata: {
				displayPath: "./src/env.ts",
				framework: "vanilla",
				validator: "arktype",
				packageManager: "pnpm",
				importPath: "./src/env",
				mode: "existing",
			},
		};

		it("returns vite-specific instructions", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: { ...basePlan.metadata, framework: "vite" },
			};
			expect(getUsageInstructions(plan)).toContain("import.meta.env.YOUR_VAR");
		});

		it("returns bun-fullstack-specific instructions", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: { ...basePlan.metadata, framework: "bun-fullstack" },
			};
			expect(getUsageInstructions(plan)).toContain("process.env.YOUR_VAR");
		});

		it("returns default instructions for vanilla", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: { ...basePlan.metadata, framework: "vanilla" },
			};
			expect(getUsageInstructions(plan)).toContain('import { env } from "./src/env"');
		});
	});
});
