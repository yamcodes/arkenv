import { describe, expect, it } from "vitest";
import {
	arktypeTwoslashOptions,
	cleanHoverDocs,
	filterTwoslashNode,
} from "./twoslash-options";
import { runTwoslash } from "./twoslash-run";

function nodesOf(
	result: Awaited<ReturnType<typeof runTwoslash>>,
	type: string,
) {
	return result.nodes.filter((node) => node.type === type);
}

describe("arktypeTwoslashOptions", () => {
	it("infers @arkenv/nextjs client variables as strings in docs snippets", async () => {
		const result = await runTwoslash(
			`// @filename: env.ts
import arkenv from "@arkenv/nextjs";
export const env = arkenv(
	{ NEXT_PUBLIC_API_URL: "string", DATABASE_URL: "string" },
	{ runtimeEnv: { NEXT_PUBLIC_API_URL: "https://api.example.com" } }
);

// @filename: page.tsx
// ---cut---
import { env } from "./env";

const apiUrl = env.NEXT_PUBLIC_API_URL;
//      ^?
`,
		);

		expect(nodesOf(result, "query")).toContainEqual(
			expect.objectContaining({
				text: "const apiUrl: string",
				target: "apiUrl",
			}),
		);
	});

	it("filters out module resolution errors in filterNode", () => {
		const filter = arktypeTwoslashOptions.twoslashOptions?.filterNode;
		if (!filter) throw new Error("filterNode is not defined");
		expect(filter).toBe(filterTwoslashNode);

		expect(
			filter({
				type: "error",
				text: "Cannot find module",
				code: 2307,
				start: 0,
				length: 1,
				level: "error",
				filename: "index.ts",
			}),
		).toBe(false);
		expect(
			filter({
				type: "error",
				text: "Cannot find name",
				code: 2304,
				start: 0,
				length: 1,
				level: "error",
				filename: "index.ts",
			}),
		).toBe(true);
		expect(
			filter({
				type: "error",
				text: "Property 'foo' does not exist",
				code: 2339,
				start: 0,
				length: 1,
				level: "error",
				filename: "index.ts",
			}),
		).toBe(true);
	});

	it("resolves flat @arkenv/nextjs env without TS2307 errors", {
		timeout: 15_000,
	}, async () => {
		const resultNextjs = await runTwoslash(
			`// @errors: 2339
// @filename: env.ts
import arkenv from "@arkenv/nextjs";
export const env = arkenv(
	{ NEXT_PUBLIC_API_URL: "string", DATABASE_URL: "string" },
	{ runtimeEnv: { NEXT_PUBLIC_API_URL: "https://api.example.com", DATABASE_URL: "postgres://localhost" } }
);

// @filename: client-component.ts
// ---cut---
import { env } from "./env";
const db = env.DATABASE_URL;
`,
		);

		// Assert we only have the TS2339 error, not TS2307
		const errors = nodesOf(resultNextjs, "error").map((e) => e.code);
		expect(errors).toContain(2339);
		expect(errors).not.toContain(2307);
	});

	it("resolves flat @arkenv/nuxt env without TS2307 errors", {
		timeout: 15_000,
	}, async () => {
		const resultNuxt = await runTwoslash(
			`// @errors: 2339
// @filename: env.ts
import arkenv from "@arkenv/nuxt";
export const env = arkenv(
	{ NUXT_PUBLIC_API_URL: "string", DATABASE_URL: "string" }
);

// @filename: app.ts
// ---cut---
import { env } from "./env";
const missing = env.DOES_NOT_EXIST;
`,
		);

		const nuxtErrors = nodesOf(resultNuxt, "error").map((e) => e.code);
		expect(nuxtErrors).toContain(2339);
		expect(nuxtErrors).not.toContain(2307);
	});

	it("typechecks @arkenv/standard/valibot without a toJsonSchema callback", async () => {
		const result = await runTwoslash(
			`import { arkenv } from "@arkenv/standard/valibot";
import * as v from "valibot";

export const env = arkenv({ PORT: v.number(), DEBUG: v.boolean() });
`,
		);

		expect(nodesOf(result, "error")).toEqual([]);
	});

	it("typechecks @arkenv/standard/zod-mini without a toJsonSchema callback", async () => {
		const result = await runTwoslash(
			`import { arkenv } from "@arkenv/standard/zod-mini";
import * as z from "zod/mini";

export const env = arkenv({ PORT: z.number(), DEBUG: z.boolean() });
`,
		);

		expect(nodesOf(result, "error")).toEqual([]);
	});

	it("typechecks Valibot toJsonSchema with a GenericSchema assertion", async () => {
		const result = await runTwoslash(
			`import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
`,
		);

		expect(nodesOf(result, "error")).toEqual([]);
	});

	it("typechecks Zod + Valibot toJsonSchema with the same GenericSchema assertion", async () => {
		const result = await runTwoslash(
			`import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as z from "zod";

export const env = arkenv(
  { PORT: z.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
`,
		);

		expect(nodesOf(result, "error")).toEqual([]);
	});

	it("typechecks the Valibot + Zod Mini toJsonSchema mix without implicit any", async () => {
		const result = await runTwoslash(
			`import arkenv from "@arkenv/standard";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import * as z from "zod/mini";

export const env = arkenv(
  {
    PORT: v.number(),
    DEBUG: z.boolean(),
  },
  {
    toJsonSchema: (schema) => {
      switch (schema["~standard"].vendor) {
        case "valibot":
          return toJsonSchema(schema as v.GenericSchema, {
            typeMode: "input",
            target: "draft-07",
          });
        case "zod":
          return z.toJSONSchema(schema as z.ZodMiniType, {
            io: "input",
            target: "draft-07",
          });
        default:
          return undefined;
      }
    },
  },
);
`,
		);

		expect(nodesOf(result, "error")).toEqual([]);
	});

	describe("cleanHoverDocs", () => {
		it("cleans multiline {@link} tags and normalizes inline whitespace", () => {
			const input =
				"Type helper to make it easier to use vite.config.ts\naccepts a direct \n{@link \nUserConfig\n}\n object, or a function that returns it.\nThe function receives a \n{@link \nConfigEnv\n}\n object.";
			const output = cleanHoverDocs(input);
			expect(output).toBe(
				"Type helper to make it easier to use vite.config.ts accepts a direct `UserConfig` object, or a function that returns it. The function receives a `ConfigEnv` object.",
			);
		});

		it("formats HTTP URLs inside {@link} as markdown links", () => {
			const input =
				"See {@link https://vite.dev/config/ Vite Configuration} for more details.";
			const output = cleanHoverDocs(input);
			expect(output).toBe(
				"See [Vite Configuration](https://vite.dev/config/) for more details.",
			);
		});

		it("preserves paragraphs and list items", () => {
			const input =
				"First paragraph.\n\nSummary of errors:\n- Error 1\n- Error 2\n\nFinal paragraph.";
			const output = cleanHoverDocs(input);
			expect(output).toBe(
				"First paragraph.\n\nSummary of errors:\n- Error 1\n- Error 2\n\nFinal paragraph.",
			);
		});
	});
});
