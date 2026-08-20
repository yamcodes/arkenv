import { createTwoslasher } from "twoslash";
import { describe, expect, it } from "vitest";
import {
	HERO_MVP_SNIPPETS,
	heroMvpEngine,
	heroMvpEnvType,
} from "./hero-mvp-snippets";
import { heroTwoslashOptions } from "./hero-mvp-twoslash-options";

describe("hero MVP snippets", () => {
	it("typecheck in Twoslash", { timeout: 30_000 }, () => {
		const slashers = {
			arktype: createTwoslasher(heroTwoslashOptions("arktype").twoslashOptions),
			standard: createTwoslasher(
				heroTwoslashOptions("standard").twoslashOptions,
			),
		};

		for (const snippet of HERO_MVP_SNIPPETS) {
			const result = slashers[heroMvpEngine(snippet.host, snippet.validator)](
				snippet.code,
				"ts",
			);
			const errors = result.errors.filter((error) => error.code !== 2307);
			expect(errors, `${snippet.host}/${snippet.validator}`).toEqual([]);
		}
	});

	it("mirrors snippet keys in the slogan env type", () => {
		expect(heroMvpEnvType("vanilla", "arktype")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "PORT", type: "number" },
		]);
		expect(heroMvpEnvType("vite", "arktype")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "VITE_API_URL", type: "string" },
		]);
		expect(heroMvpEnvType("next", "zod")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "NEXT_PUBLIC_API_URL", type: "string" },
			{ name: "PORT", type: "number" },
		]);
	});

	it("uses ArkEnv coercion for Zod and Valibot", () => {
		const zod = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.validator === "zod",
		);
		const valibot = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.validator === "valibot",
		);

		for (const snippet of zod) {
			expect(snippet.code).toContain("z.number()");
			expect(snippet.code).not.toContain("z.coerce");
		}
		for (const snippet of valibot) {
			expect(snippet.code).toContain("v.optional(v.number(), 3000)");
			expect(snippet.code).toContain("toJsonSchema");
			expect(snippet.code).not.toContain("v.toNumber");
		}
	});
});
