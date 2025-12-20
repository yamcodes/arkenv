import { type, scope } from "arktype";

console.log("\n--- Checking Module Root Override ---");

const coercedNumber = type("string | number")
	.pipe((s) => {
		const n = Number(s);
		return isNaN(n) ? s : n;
	})
	.narrow((n, ctx): n is number => {
		if (typeof n !== "number") {
			return ctx.mustBe("a valid number");
		}
		return true;
	});

const myScope = scope({
	number: type.module({
		...type.keywords.number,
		root: coercedNumber,
	}),
});

console.log("Testing 'number' (root override)...");
const tNum = myScope.type("number");
const resNum = tNum("123");
if (resNum instanceof type.errors) {
	console.log("❌ 'number' failed:", resNum.summary);
} else {
	console.log("✅ 'number' passed:", resNum);
}

console.log("\nTesting 'number.integer' (inherited sub-keyword)...");
const tInt = myScope.type("number.integer");
const resInt = tInt("123");

if (resInt instanceof type.errors) {
	console.log("❌ 'number.integer' failed:", resInt.summary);
} else {
	console.log("✅ 'number.integer' passed:", resInt);
}

console.log("\nTesting 'number.integer' with float string...");
const resFloat = tInt("123.5");
if (resFloat instanceof type.errors) {
	console.log(
		"✅ 'number.integer' correctly failed for float:",
		resFloat.summary,
	);
} else {
	console.log("❌ 'number.integer' wrongly passed for float:", resFloat);
}
