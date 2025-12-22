import { match, scope, type } from "arktype";

const maybeParsedNumber = (s: any) => {
	if (typeof s === "number") return s;
	const n = Number(s);
	return isNaN(n) ? s : n;
};

const $coerced = scope({
	// Override the base number
	number: type("number | string").pipe(
		match({
			number: (n) => n,
			string: (s) => maybeParsedNumber(s),
		}),
	),
	// Define a sub-type using that overridden number
	"number.port": "0 <= number.integer <= 65535",
});

const MyEnv = $coerced.type({
	PORT: "number.port",
});

console.log("Coerced Port:");
console.log(MyEnv({ PORT: "3000" }));
