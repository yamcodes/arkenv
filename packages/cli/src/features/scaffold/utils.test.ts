import { describe, expect, it } from "vitest";
import { code } from "@/shared/visuals";
import type { ScaffoldingPlan } from "./plan";
import { getInstallCommand, getNextStepsNote } from "./utils";

describe("scaffold utils", () => {
	describe("getInstallCommand", () => {
		it("returns pnpm add when dependencies are present", () => {
			expect(getInstallCommand("pnpm", ["arkenv"])).toEqual([
				"pnpm",
				["add", "arkenv"],
			]);
		});

		it("returns pnpm install when no dependencies are present", () => {
			expect(getInstallCommand("pnpm", [])).toEqual(["pnpm", ["install"]]);
		});

		it("returns yarn add when dependencies are present", () => {
			expect(getInstallCommand("yarn", ["arkenv"])).toEqual([
				"yarn",
				["add", "arkenv"],
			]);
		});

		it("returns yarn install when no dependencies are present", () => {
			expect(getInstallCommand("yarn", [])).toEqual(["yarn", ["install"]]);
		});

		it("returns bun add when dependencies are present", () => {
			expect(getInstallCommand("bun", ["arkenv"])).toEqual([
				"bun",
				["add", "arkenv"],
			]);
		});

		it("returns bun install when no dependencies are present", () => {
			expect(getInstallCommand("bun", [])).toEqual(["bun", ["install"]]);
		});

		it("returns npm install when dependencies are present", () => {
			expect(getInstallCommand("npm", ["arkenv"])).toEqual([
				"npm",
				["install", "arkenv"],
			]);
		});

		it("returns npm install when no dependencies are present", () => {
			expect(getInstallCommand("npm", [])).toEqual(["npm", ["install"]]);
		});

		it("falls back to npm install for unknown package managers", () => {
			expect(getInstallCommand("unknown-pm", ["arkenv"])).toEqual([
				"npm",
				["install", "arkenv"],
			]);
		});
	});

	describe("getNextStepsNote", () => {
		const basePlan: ScaffoldingPlan = {
			cwd: ".",
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

		it("returns AI assistant instruction if skill is installed", () => {
			const note = getNextStepsNote(basePlan, true);
			expect(note.title).toBe("Next steps");
			expect(note.message).toContain(
				`${code("/arkenv")} - automatically refine your schema`,
			);
		});

		it("returns AI assistant instruction if skill is detected in metadata", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					skillDetected: true,
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.title).toBe("Next steps");
			expect(note.message).toContain(
				`${code("/arkenv")} - automatically refine your schema`,
			);
		});

		it("returns vite-specific instructions when skill is not installed/detected", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "vite",
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).toContain(
				`Check ${code("./src/env.ts")} and refine your environment schema.`,
			);
			expect(note.message).toContain(
				`Access via ${code("import.meta.env.YOUR_VAR")}`,
			);
		});

		it("returns bun-fullstack-specific instructions when skill is not installed/detected", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "bun-fullstack",
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).toContain(
				`Access via ${code("process.env.YOUR_VAR")}`,
			);
		});

		it("returns nextjs-specific instructions with codegen enabled", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					disableCodegen: false,
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).toContain(
				`Wrap your Next.js config with ${code("withArkEnv")} inside ${code("next.config.ts")}`,
			);
			expect(note.message).toContain(
				code('import { withArkEnv } from "@arkenv/nextjs/config";'),
			);
			expect(note.message).toContain(
				code("export default withArkEnv(nextConfig);"),
			);
			expect(note.message).toContain(
				`Import and use: ${code('import { env } from "./src/env"')}`,
			);
		});

		it("omits withArkEnv instruction when nextjs config is bootstrapped", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					disableCodegen: false,
				},
			};
			const note = getNextStepsNote(plan, false, true);
			expect(note.message).not.toContain("withArkEnv");
			expect(note.message).toContain(
				`Import and use: ${code('import { env } from "./src/env"')}`,
			);
		});

		it("includes withArkEnv instruction even when skill is installed but nextjs config is not bootstrapped", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					disableCodegen: false,
				},
			};
			const note = getNextStepsNote(plan, true, false);
			expect(note.message).toContain(
				`${code("/arkenv")} - automatically refine your schema`,
			);
			expect(note.message).toContain("withArkEnv");
		});

		it("omits withArkEnv when skill is installed and nextjs config IS bootstrapped", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					disableCodegen: false,
				},
			};
			const note = getNextStepsNote(plan, true, true);
			expect(note.message).toContain(
				`${code("/arkenv")} - automatically refine your schema`,
			);
			expect(note.message).not.toContain("withArkEnv");
		});

		it("returns nextjs-specific instructions with codegen disabled", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					disableCodegen: true,
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).not.toContain("withArkEnv");
			expect(note.message).toContain(
				`Import and use: ${code('import { env } from "./src/env"')}`,
			);
		});

		it("returns nextjs-specific instructions with strict layout and codegen enabled", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					layout: "strict",
					disableCodegen: false,
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).toContain(
				`Wrap your Next.js config with ${code("withArkEnv")} inside ${code("next.config.ts")}`,
			);
			expect(note.message).toContain(
				code('import { withArkEnv } from "@arkenv/nextjs/config";'),
			);
			expect(note.message).toContain(
				code("export default withArkEnv(nextConfig);"),
			);
			expect(note.message).toContain(
				`Import and use: ${code('import { env } from "./src/env/client"')} (client) or ${code('import { env } from "./src/env/server"')} (server)`,
			);
		});

		it("returns nextjs-specific instructions with strict layout and codegen disabled", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				metadata: {
					...basePlan.metadata,
					framework: "nextjs",
					layout: "strict",
					disableCodegen: true,
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).not.toContain("withArkEnv");
			expect(note.message).toContain(
				`Import and use: ${code('import { env } from "./src/env/client"')} (client) or ${code('import { env } from "./src/env/server"')} (server)`,
			);
		});

		it("returns default instructions for vanilla framework", () => {
			const note = getNextStepsNote(basePlan, false);
			expect(note.message).toContain(
				`Import and use: ${code('import { env } from "./src/env"')}`,
			);
		});

		it("uses custom skill package name and dlx command if configured in plan", () => {
			const plan: ScaffoldingPlan = {
				...basePlan,
				skill: {
					dlxCommand: ["bun", "x"],
					packageName: "custom-packageName",
					isYes: true,
				},
			};
			const note = getNextStepsNote(plan, false);
			expect(note.message).toContain(
				`Install the AI skill: ${code("bun x skills add custom-packageName")}`,
			);
		});

		it("falls back to default dlx command and package name if not configured in plan", () => {
			const note = getNextStepsNote(basePlan, false);
			expect(note.message).toContain(
				`Install the AI skill: ${code("npx skills add yamcodes/arkenv")}`,
			);
		});
	});
});
