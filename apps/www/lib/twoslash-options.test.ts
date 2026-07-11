import { twoslasher } from "twoslash";
import { describe, expect, it } from "vitest";
import { arktypeTwoslashOptions } from "./twoslash-options";

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
			arktypeTwoslashOptions.twoslashOptions,
		);

		expect(result.queries).toContainEqual(
			expect.objectContaining({
				text: "const apiUrl: string",
				target: "apiUrl",
			}),
		);
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
import { type } from "@arkenv/core";
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
			arktypeTwoslashOptions.twoslashOptions,
		);

		// Assert we only have the TS2339 error, not TS2307
		const errors = resultNextjs.errors.map((e) => e.code);
		expect(errors).toContain(2339);
		expect(errors).not.toContain(2307);

		const resultNuxt = twoslasher(
			`// @errors: 2339
// @filename: env/internal/shared.ts
import { type } from "@arkenv/core";
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
			arktypeTwoslashOptions.twoslashOptions,
		);

		const nuxtErrors = resultNuxt.errors.map((e) => e.code);
		expect(nuxtErrors).toContain(2339);
		expect(nuxtErrors).not.toContain(2307);
	});
});
