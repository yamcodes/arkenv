import { arkenv as arkenvStandard } from "@arkenv/standard";
import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { arkenv, type Infer, type } from ".";

describe("Infer<T> Type Helper", () => {
	it("infers types from a declarative schema shape", () => {
		const schema = {
			PORT: "number.port",
			HOST: "string.host",
			DEBUG: "boolean?",
		} as const;

		type Inferred = Infer<typeof schema>;

		expectTypeOf({} as Inferred).toEqualTypeOf<{
			PORT: number;
			HOST: string;
			DEBUG?: boolean;
		}>();
	});

	it("infers types from a compiled ArkType schema", () => {
		const schema = type({
			PORT: "number.port",
			HOST: "string.host",
		});

		type Inferred = Infer<typeof schema>;

		expectTypeOf({} as Inferred).toEqualTypeOf<{
			PORT: number;
			HOST: string;
		}>();
	});

	it("infers types from a Zod schema", () => {
		const schema = z.object({
			PORT: z.coerce.number(),
			HOST: z.string(),
			DEBUG: z.boolean().optional(),
		});

		type Inferred = Infer<typeof schema>;

		expectTypeOf({} as Inferred).toEqualTypeOf<{
			PORT: number;
			HOST: string;
			DEBUG?: boolean | undefined;
		}>();
	});
});

describe("arkenv Type Inference with Zod", () => {
	it("infers types correctly with arkenv (core) using a declarative shape", () => {
		const schema = {
			PORT: z.coerce.number(),
			HOST: z.string(),
		};

		const env = arkenv(schema, { env: { PORT: "3000", HOST: "localhost" } });

		expectTypeOf(env).toEqualTypeOf<{
			PORT: number;
			HOST: string;
		}>();
	});

	it("infers types correctly with arkenv/standard", () => {
		const schema = {
			PORT: z.coerce.number(),
			HOST: z.string(),
		};

		const env = arkenvStandard(schema, {
			env: { PORT: "3000", HOST: "localhost" },
		});

		expectTypeOf(env).toEqualTypeOf<{
			PORT: number;
			HOST: string;
		}>();
	});
});
