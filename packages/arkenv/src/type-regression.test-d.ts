import { describe, expectTypeOf, it } from "vitest";
import { arkenv, type } from "./";

describe("Type Regression (Issue #796)", () => {
	it("inline and explicit schemas infer the same type", () => {
		const inline = arkenv({ PORT: "number" }, { env: { PORT: "3000" } });
		const explicit = arkenv(type({ PORT: "number" }), {
			env: { PORT: "3000" },
		});

		expectTypeOf(inline).toEqualTypeOf(explicit);
	});

	it("narrows basic types correctly", () => {
		const env = arkenv(
			{ STR: "string", NUM: "number", BOOL: "boolean" },
			{ env: { STR: "hi", NUM: "1", BOOL: "true" } },
		);

		expectTypeOf(env.STR).toBeString();
		expectTypeOf(env.NUM).toBeNumber();
		expectTypeOf(env.BOOL).toBeBoolean();
	});

	it("infers unions correctly", () => {
		const env = arkenv({ VAL: "string | number" }, { env: { VAL: "123" } });
		expectTypeOf(env.VAL).toEqualTypeOf<string | number>();
	});

	it("infers custom keywords correctly", () => {
		const env = arkenv(
			{ PORT: "number.port", HOST: "string.host" },
			{ env: { PORT: "8080", HOST: "localhost" } },
		);
		expectTypeOf(env.PORT).toBeNumber();
		expectTypeOf(env.HOST).toBeString();
	});

	it("infers arrays correctly", () => {
		const env = arkenv({ TAGS: "string[]" }, { env: { TAGS: "a,b,c" } });
		expectTypeOf(env.TAGS).toEqualTypeOf<string[]>();
	});

	it("infers optional variables correctly", () => {
		const env = arkenv({ "OPTIONAL?": "string" }, { env: {} });
		expectTypeOf(env.OPTIONAL).toEqualTypeOf<string | undefined>();
	});

	it("infers default values correctly", () => {
		const env = arkenv({ WITH_DEFAULT: "string = 'default'" }, { env: {} });
		expectTypeOf(env.WITH_DEFAULT).toBeString();
	});

	/* 
	   TODO: Re-enable completion snapshots once @ark/attest supports arktype@2.2.0.
	   Currently deferred due to a version conflict (Scope already named Array).
	   
	   Local Issue: https://github.com/yamcodes/arkenv/issues/895
	   Upstream Issue: https://github.com/arktypeio/arktype/issues/1617

	   it("snapshots DSL completions for inline values", () => {
	       attest(() => arkenv({ PORT: "n" })).completions({ n: ["never", "null", "number"] });
	   });
	*/
});
