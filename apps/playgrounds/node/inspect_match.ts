import { type, match } from "arktype";

const maybeParsedNumber = (s: any) => {
	const n = Number(s);
	return isNaN(n) ? s : n;
};

const maybeParsedBoolean = (s: any) => {
	if (s === "true") return true;
	if (s === "false") return false;
	return s;
};

// Simple coercion layer?
const coerceValue = match({
	number: (v) => v,
	boolean: (v) => v,
	string: (s) => {
		// Here we need to know if we WANT a number or boolean
		return s;
	},
	default: (v) => v,
});

const schema = type({ a: "number", b: "boolean" });

// Maybe something like this?
const simpleCoerce = (schema: any) => {
	return type("unknown")
		.pipe((v) => {
			if (typeof v !== "object" || v === null) return v;
			const result: any = { ...v };
			// This still feels manual...
			for (const k in result) {
				// How do we use match here?
			}
			return result;
		})
		.pipe(schema);
};

console.log("Match in action:");
const m = match({
	number: (n) => n + 1,
	string: (s) => s.toUpperCase(),
	default: "assert",
});
console.log(m(1));
console.log(m("hi"));
