import { scope, type, match } from "arktype";

const maybeParsedNumber = (s: any) => {
	if (typeof s === "number") return s;
	const n = Number(s);
	return isNaN(n) ? s : n;
};

const $coerced = scope({
	number: type("number | string").pipe(
		match({
			number: (n) => n,
			string: (s) => maybeParsedNumber(s),
		}),
	),
	boolean: type("boolean | string").pipe(
		match({
			boolean: (b) => b,
			string: (s) => {
				if (s === "true") return true;
				if (s === "false") return false;
				return s;
			},
		}),
	),
});

// An external, strict schema
const strictSchema = type({
	PORT: "number",
	DEBUG: "boolean?",
});

console.log("Strict validation (should fail):");
console.log(strictSchema({ PORT: "3000" }).toString());

// THE MAGIC: Re-parse in coerced scope
const coercedSchema = $coerced.type(strictSchema.in.json as any);

console.log("\nCoerced validation (should pass):");
console.log(coercedSchema({ PORT: "3000", DEBUG: "true" }));
