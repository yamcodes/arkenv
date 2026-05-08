import { attest } from "@ark/attest";
import { describe, it } from "vitest";
import { createEnv, type } from "./index";

describe("Type Regression (Issue #796)", () => {
	it("inline and explicit schemas infer the same type", () => {
		const inline = createEnv({ PORT: "number" }, { env: { PORT: "3000" } });
		const explicit = createEnv(type({ PORT: "number" }), {
			env: { PORT: "3000" },
		});
		attest<typeof explicit>(inline);
	});

	it("narrows basic types correctly", () => {
		const env = createEnv(
			{ STR: "string", NUM: "number", BOOL: "boolean" },
			{ env: { STR: "hi", NUM: "1", BOOL: "true" } },
		);
		attest<string>(env.STR);
		attest<number>(env.NUM);
		attest<boolean>(env.BOOL);
	});

	it("should fail for invalid DSL strings", () => {
		attest(() =>
			// @ts-expect-error
			createEnv({ KEY: "invalid" }, { env: { KEY: "val" } }),
		).throwsAndHasTypeError("'invalid' is unresolvable");
	});

	it("snapshots DSL completions for inline values (autocompletion regression)", () => {
		attest(() =>
			// @ts-expect-error
			createEnv({ PORT: "n" }),
		).completions({ n: ["never", "null", "number"] });
	});

	it("snapshots sub-keyword completions", () => {
		attest(() =>
			// @ts-expect-error
			createEnv({ PORT: "number." }),
		).completions({
			"number.": [
				"number.Infinity",
				"number.NaN",
				"number.NegativeInfinity",
				"number.epoch",
				"number.integer",
				"number.port",
				"number.safe",
			],
		});
	});

	it("infers unions correctly", () => {
		const env = createEnv({ VAL: "string | number" }, { env: { VAL: "123" } });
		attest<string | number>(env.VAL);
	});

	it("infers custom keywords correctly", () => {
		const env = createEnv(
			{ PORT: "number.port", HOST: "string.host" },
			{ env: { PORT: "8080", HOST: "localhost" } },
		);
		attest<number>(env.PORT);
		attest<string>(env.HOST);
	});

	it("infers arrays correctly", () => {
		const env = createEnv({ TAGS: "string[]" }, { env: { TAGS: "a,b,c" } });
		attest<string[]>(env.TAGS);
	});

	it("infers optional variables correctly", () => {
		const env = createEnv({ "OPTIONAL?": "string" }, { env: {} });
		attest<string | undefined>(env.OPTIONAL);
	});

	it("infers default values correctly", () => {
		const env = createEnv({ WITH_DEFAULT: "string = 'default'" }, { env: {} });
		attest<string>(env.WITH_DEFAULT);
	});
});
