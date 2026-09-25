import { describe, expectTypeOf, it } from "vitest";
import { type ArkEnvConfig, arkenv, type } from ".";

describe("Type Regression (Issue #1912)", () => {
	it("does not expose reserved safe on ArkEnvConfig", () => {
		expectTypeOf<ArkEnvConfig>().not.toHaveProperty("safe");
	});
});

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
	   DSL completion snapshots stay off. ArkType 2.2.5 lets two scopes share
	   a name (arktypeio/arktype#1617), so @ark/attest can load beside
	   @arkenv/core. `attest(() => arkenv({ PORT: "n" })).completions(...)`
	   still returns {} — the language service offers no suggestions at that
	   string. https://github.com/yamcodes/arkenv/issues/895
	*/
});
