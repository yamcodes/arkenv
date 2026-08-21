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
			{ name: "PORT", type: "number" },
		]);
		expect(heroMvpEnvType("next", "zod")).toEqual([
			{ name: "DATABASE_URL", type: "string" },
			{ name: "NEXT_PUBLIC_API_URL", type: "string" },
			{ name: "PORT", type: "number" },
		]);
	});

	it("uses ArkEnv coercion for Zod", () => {
		const zod = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.validator === "zod",
		);

		for (const snippet of zod) {
			expect(snippet.code).toContain("z.number()");
			expect(snippet.code).not.toContain("z.coerce");
		}
	});

	it("mirrors DATABASE_URL and PORT with ArkType bounds, not number.port", () => {
		const vanilla = HERO_MVP_SNIPPETS.filter(
			(snippet) => snippet.host === "vanilla",
		);
		const arktype = vanilla.find((snippet) => snippet.validator === "arktype");
		const zod = vanilla.find((snippet) => snippet.validator === "zod");

		expect(arktype?.code).toContain('DATABASE_URL: "string.url"');
		expect(arktype?.code).toContain(
			'PORT: "0 <= number.integer <= 65535 = 3000"',
		);
		expect(arktype?.code).not.toContain("number.port");
		expect(zod?.code).toContain("DATABASE_URL: z.url()");
		expect(zod?.code).toContain(
			"PORT: z.number().int().min(0).max(65535).default(3000)",
		);
	});
});
