import { match, scope, type } from "arktype";

const maybeParsedNumber = (s: any) => {
	if (typeof s === "number") return s;
	const n = Number(s);
	return isNaN(n) ? s : n;
};

const $ = scope({
	// Redefine number to include coercion
	number: type("number | string").pipe(
		match({
			number: (n) => n,
			string: (s) => maybeParsedNumber(s),
		}),
	),
});

const MyEnv = $.type({
	PORT: "number",
	LIMIT: "number > 10",
});

console.log("Validation with string:");
console.log(MyEnv({ PORT: "3000", LIMIT: "20" }));

console.log("\nValidation with number:");
console.log(MyEnv({ PORT: 3000, LIMIT: 20 }));

console.log("\nValidation failure:");
console.log(MyEnv({ PORT: "3000", LIMIT: "5" }));
