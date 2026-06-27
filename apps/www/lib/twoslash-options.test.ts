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

	it("filters out module resolution and missing name errors in filterNode", () => {
		const filter = arktypeTwoslashOptions.filterNode;
		if (!filter) throw new Error("filterNode is not defined");

		expect(
			filter({
				type: "error",
				text: "Cannot find module",
				code: 2307,
				line: 1,
				character: 1,
			} as any),
		).toBe(false);
		expect(
			filter({
				type: "error",
				text: "Cannot find name",
				code: 2304,
				line: 1,
				character: 1,
			} as any),
		).toBe(false);
		expect(
			filter({
				type: "error",
				text: "Property 'foo' does not exist",
				code: 2339,
				line: 1,
				character: 1,
			} as any),
		).toBe(true);
	});
});
