import { describe, expectTypeOf, it } from "vitest";
import { createEnv, type RuntimeEnvironment, type } from "./index";

describe("Type Regression (Issue #796)", () => {
	it("inline and explicit schemas infer the same type", () => {
		const inline = createEnv({ PORT: "number" }, { env: { PORT: "3000" } });
		const explicit = createEnv(type({ PORT: "number" }), {
			env: { PORT: "3000" },
		});

		expectTypeOf(inline).toEqualTypeOf(explicit);
	});

	it("narrows basic types correctly", () => {
		const env = createEnv(
			{ STR: "string", NUM: "number", BOOL: "boolean" },
			{ env: { STR: "hi", NUM: "1", BOOL: "true" } },
		);

		expectTypeOf(env.STR).toBeString();
		expectTypeOf(env.NUM).toBeNumber();
		expectTypeOf(env.BOOL).toBeBoolean();
	});

	it("infers unions correctly", () => {
		const env = createEnv({ VAL: "string | number" }, { env: { VAL: "123" } });
		expectTypeOf(env.VAL).toEqualTypeOf<string | number>();
	});

	it("infers custom keywords correctly", () => {
		const env = createEnv(
			{ PORT: "number.port", HOST: "string.host" },
			{ env: { PORT: "8080", HOST: "localhost" } },
		);
		expectTypeOf(env.PORT).toBeNumber();
		expectTypeOf(env.HOST).toBeString();
	});

	it("infers arrays correctly", () => {
		const env = createEnv({ TAGS: "string[]" }, { env: { TAGS: "a,b,c" } });
		expectTypeOf(env.TAGS).toEqualTypeOf<string[]>();
	});

	it("infers optional variables correctly", () => {
		const env = createEnv({ "OPTIONAL?": "string" }, { env: {} });
		expectTypeOf(env.OPTIONAL).toEqualTypeOf<string | undefined>();
	});

	it("infers default values correctly", () => {
		const env = createEnv({ WITH_DEFAULT: "string = 'default'" }, { env: {} });
		expectTypeOf(env.WITH_DEFAULT).toBeString();
	});

	/* 
	   TODO: Re-enable completion snapshots once @ark/attest supports arktype@2.2.0.
	   Currently deferred due to a version conflict (Scope already named Array).
	   
	   Local Issue: https://github.com/yamcodes/arkenv/issues/895
	   Upstream Issue: https://github.com/arktypeio/arktype/issues/1617

	   it("snapshots DSL completions for inline values", () => {
	       attest(() => createEnv({ PORT: "n" })).completions({ n: ["never", "null", "number"] });
	   });
	*/

	it("exports RuntimeEnvironment as Record<string, string | undefined>", () => {
		expectTypeOf<RuntimeEnvironment>().toEqualTypeOf<
			Record<string, string | undefined>
		>();
	});
});
