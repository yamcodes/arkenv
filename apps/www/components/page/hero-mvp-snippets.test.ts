import { describe, expect, it } from "vitest";
import { runTwoslash } from "~/lib/twoslash-run";
import {
	HERO_MVP_SNIPPETS,
	heroMvpEngine,
	heroMvpEnvType,
} from "./hero-mvp-snippets";
import { heroTwoslashOptions } from "./hero-mvp-twoslash-options";

describe("hero MVP snippets", () => {
	it("typecheck in Twoslash", { timeout: 30_000 }, async () => {
		for (const snippet of HERO_MVP_SNIPPETS) {
			const engine = heroMvpEngine(snippet.host, snippet.validator);
			const result = await runTwoslash(
				snippet.code,
				"ts",
				heroTwoslashOptions(engine),
			);
			const errors = result.nodes.filter(
				(node) => node.type === "error" && node.code !== 2307,
			);
			expect(errors, `${snippet.host}/${snippet.validator}`).toEqual([]);
		}
	});

	it("mirrors snippet keys in the slogan env type", () => {
		expect(heroMvpEnvType("vanilla", "arktype")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "PORT", type: "number" },
			{ name: "CI", type: "boolean" },
		]);
		expect(heroMvpEnvType("vite", "arktype")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "VITE_API_URL", type: "string" },
			{ name: "PORT", type: "number" },
			{ name: "CI", type: "boolean" },
		]);
		expect(heroMvpEnvType("next", "zod")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "NEXT_PUBLIC_API_URL", type: "string" },
			{ name: "PORT", type: "number" },
			{ name: "CI", type: "boolean" },
		]);
		expect(heroMvpEnvType("vanilla", "valibot")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "PORT", type: "number" },
			{ name: "CI", type: "boolean" },
		]);
	});

	it("uses ArkEnv coercion for Zod and Valibot", () => {
		const zod = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.validator === "zod",
		);

		for (const snippet of zod) {
			expect(snippet.code).toContain("z.int()");
			expect(snippet.code).not.toContain("z.coerce");
		}

		const valibot = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.validator === "valibot",
		);

		for (const snippet of valibot) {
			expect(snippet.code).toContain("v.number()");
			expect(snippet.code).not.toContain("v.transform");
		}
	});

	it("mirrors DATABASE_URL, PORT, and CI with ArkType bounds, not number.port", () => {
		const vanilla = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.host === "vanilla",
		);
		const arktype = vanilla.find((snippet) => snippet.validator === "arktype");
		const zod = vanilla.find((snippet) => snippet.validator === "zod");
		const valibot = vanilla.find((snippet) => snippet.validator === "valibot");

		expect(arktype?.code).toContain('DATABASE_URL: "string.url"');
		expect(arktype?.code).toContain(
			'PORT: "0 <= number.integer <= 65535 = 3000"',
		);
		expect(arktype?.code).toContain('CI: "boolean = false"');
		expect(arktype?.code).not.toContain("number.port");
		expect(arktype?.code).not.toContain("NODE_ENV");
		expect(arktype?.code).not.toContain("LOG_LEVEL");
		expect(zod?.code).toContain("DATABASE_URL: z.url()");
		expect(zod?.code).toContain(
			"PORT: z.int().min(0).max(65535).default(3000)",
		);
		expect(zod?.code).toContain("CI: z.boolean().default(false)");
		expect(zod?.code).not.toContain("NODE_ENV");
		expect(zod?.code).not.toContain("LOG_LEVEL");
		expect(valibot?.code).toContain(
			"DATABASE_URL: v.pipe(v.string(), v.url())",
		);
		expect(valibot?.code).toContain("PORT: v.optional(");
		expect(valibot?.code).toContain("v.pipe(");
		expect(valibot?.code).toContain("v.number()");
		expect(valibot?.code).toContain("v.integer()");
		expect(valibot?.code).toContain("v.minValue(0)");
		expect(valibot?.code).toContain("v.maxValue(65535)");
		expect(valibot?.code).toContain("3000");
		expect(valibot?.code).toContain("CI: v.optional(v.boolean(), false)");
		expect(valibot?.code).not.toContain("NODE_ENV");
		expect(valibot?.code).not.toContain("LOG_LEVEL");
	});
});
