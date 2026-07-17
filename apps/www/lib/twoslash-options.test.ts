import { createTwoslasher } from "twoslash";
import { describe, expect, it } from "vitest";
import { arktypeTwoslashOptions, transformDocs } from "./twoslash-options";

// Use createTwoslasher so vfsRoot is applied at factory time.
// The standalone twoslasher() only reads compilerOptions/handbookOptions per-call
// and ignores vfsRoot, causing path alias resolution to fail on CI.
const twoslasher = createTwoslasher(arktypeTwoslashOptions.twoslashOptions);

describe("arktypeTwoslashOptions", () => {
	it("infers @arkenv/nextjs client variables as strings in docs snippets", () => {
		const result = twoslasher(
			`// @filename: env.ts
import arkenv from "@arkenv/nextjs";
export const env = arkenv({
	server: { DATABASE_URL: "string" },
	client: { NEXT_PUBLIC_API_URL: "string" },
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: "https://api.example.com",
	}
});

// @filename: page.tsx
// ---cut---
import { env } from "./env";

const apiUrl = env.NEXT_PUBLIC_API_URL;
//      ^?
`,
			"ts",
		);

		expect(result.queries).toContainEqual(
			expect.objectContaining({
				text: "const apiUrl: string",
				target: "apiUrl",
			}),
		);
	});

	describe("transformDocs", () => {
		it("renders a {@link symbol} tag inline as a code reference", () => {
			expect(transformDocs("An alias for {@link createEnv}.")).toBe(
				"An alias for `createEnv`.",
			);
		});

		it("renders a {@link url | label} tag as a single inline anchor", () => {
			expect(
				transformDocs("See {@link https://arkenv.js.org | ArkEnv} for docs."),
			).toBe("See [ArkEnv](https://arkenv.js.org) for docs.");
		});

		it("falls back to the raw URL as link text when no label is given", () => {
			expect(transformDocs("See {@link https://arkenv.js.org}.")).toBe(
				"See [https://arkenv.js.org](https://arkenv.js.org).",
			);
		});

		it("handles TypeScript's serialized {@link} form (newlines, no pipe)", () => {
			// This is the exact shape Twoslash yields for the `arkenv` default export:
			// tags are wrapped in newlines and the `|` label separator is dropped.
			const raw =
				"ArkEnv's main export, an alias for \n{@link \ncreateEnv\n}\n\n\n\n{@link \nhttps://arkenv.js.org ArkEnv\n}\n is a typesafe environment variables validator from editor to runtime.";

			const result = transformDocs(raw);

			// {@link symbol} flows inline as a code reference.
			expect(result).toContain("`createEnv`");
			// {@link url | label} becomes a single inline anchor with the label as text.
			expect(result).toContain("[ArkEnv](https://arkenv.js.org)");
			// No dangling raw URL text is left outside the anchor.
			expect(result).not.toMatch(/https:\/\/arkenv\.js\.org(?!\))/);
			// The genuine paragraph break is preserved as exactly one blank line...
			expect(result).toContain("\n\n");
			expect(result).not.toContain("\n\n\n");
			// ...and no line breaks are introduced within a sentence.
			expect(result.split("\n\n")[1]).not.toContain("\n");
		});

		it("collapses single newlines to spaces but preserves paragraph breaks", () => {
			expect(
				transformDocs("line one\nstill line one\n\nsecond paragraph"),
			).toBe("line one still line one\n\nsecond paragraph");
		});
	});

	it("filters out module resolution errors in filterNode", () => {
		const filter = arktypeTwoslashOptions.filterNode;
		if (!filter) throw new Error("filterNode is not defined");

		expect(
			filter({
				type: "error",
				text: "Cannot find module",
				code: 2307,
				line: 1,
				character: 1,
			}),
		).toBe(false);
		expect(
			filter({
				type: "error",
				text: "Cannot find name",
				code: 2304,
				line: 1,
				character: 1,
			}),
		).toBe(true);
		expect(
			filter({
				type: "error",
				text: "Property 'foo' does not exist",
				code: 2339,
				line: 1,
				character: 1,
			}),
		).toBe(true);
	});

	it("resolves '@/env/client' and '~~/env/client' without TS2307 errors", () => {
		const resultNextjs = twoslasher(
			`// @errors: 2339
// @filename: env/internal/shared.ts
import { type } from "@arkenv/nextjs/shared";
export const SharedSchema = type({ NODE_ENV: "'development' | 'production' | 'test'" });

// @filename: env/client.ts
import arkenv from "@arkenv/nextjs/client";
import { SharedSchema } from "./internal/shared";
export const env = arkenv(
	{ NEXT_PUBLIC_API_URL: "string" },
	{ extends: [SharedSchema], runtimeEnv: { NEXT_PUBLIC_API_URL: "https://api.example.com", NODE_ENV: "development" } }
);

// @filename: client-component.ts
// ---cut---
import { env } from "@/env/client";
const db = env.DATABASE_URL;
`,
			"ts",
		);

		// Assert we only have the TS2339 error, not TS2307
		const errors = resultNextjs.errors.map((e) => e.code);
		expect(errors).toContain(2339);
		expect(errors).not.toContain(2307);

		const resultNuxt = twoslasher(
			`// @errors: 2339
// @filename: env/internal/shared.ts
import { type } from "@arkenv/nuxt/shared";
export const SharedSchema = type({ NODE_ENV: "'development' | 'production' | 'test'" });

// @filename: env/client.ts
import arkenv from "@arkenv/nuxt/client";
import { SharedSchema } from "./internal/shared";
export const env = arkenv(
	{ NUXT_PUBLIC_API_URL: "string" },
	{ extends: [SharedSchema] }
);

// @filename: pages/index.ts
// ---cut---
import { env } from "~~/env/client";
const db = env.DATABASE_URL;
`,
			"ts",
		);

		const nuxtErrors = resultNuxt.errors.map((e) => e.code);
		expect(nuxtErrors).toContain(2339);
		expect(nuxtErrors).not.toContain(2307);
	});
});
