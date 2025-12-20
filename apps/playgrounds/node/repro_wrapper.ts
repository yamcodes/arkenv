import { type, scope } from "arktype";

console.log("\n--- Checking Module Wrapping Strategy ---");

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

const originalNumberModule = type.keywords.number;
const newNumberModule: any = { root: coercedNumber };

for (const key in originalNumberModule) {
	if (key === "root") continue;
	// We assume all other properties are Types that expect number
	// We pipe the coerced number to them.
	// Note: We need to ensure we are piping to a valid Type.
	const originalSub = (originalNumberModule as any)[key];
	// Check if it's a type (callable)
	if (typeof originalSub === "function") {
		newNumberModule[key] = coercedNumber.pipe(originalSub);
	} else {
		newNumberModule[key] = originalSub;
	}
}

const myScope = scope({
	number: type.module(newNumberModule),
});

console.log("Testing 'number.integer' (wrapped)...");
const tInt = myScope.type("number.integer");
const resInt = tInt("123");

if (resInt instanceof type.errors) {
	console.log("❌ 'number.integer' failed:", resInt.summary);
} else {
	console.log("✅ 'number.integer' passed:", resInt);
}

console.log("\nTesting 'number.epoch' (wrapped)...");
// Assuming epoch expects integer/number
const tEpoch = myScope.type("number.epoch");
// Epoch usually has bounds, let's use a safe timestamp
const ts = "1678886400000";
const resEpoch = tEpoch(ts);

if (resEpoch instanceof type.errors) {
	console.log("❌ 'number.epoch' failed:", resEpoch.summary);
} else {
	console.log("✅ 'number.epoch' passed:", resEpoch);
}
