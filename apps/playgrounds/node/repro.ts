import { type, scope } from "arktype";

console.log("\n--- Checking Sub-keyword Propagation ---");

// Define a scope where 'number' is overridden to accept strings
const myScope = scope({
	number: type("string | number")
		.pipe((s) => {
			const n = Number(s);
			return isNaN(n) ? s : n;
		})
		.narrow((n, ctx): n is number => {
			if (typeof n !== "number") {
				return ctx.mustBe("a valid number");
			}
			return true;
		}),
});

// Test number.integer from the customized scope
// We expect this to FAIL if number.integer doesn't inherit the coercion
console.log("Testing number.integer with string input '123'...");
try {
	// Note: We access number.integer from the scoped type
	// In strict ArkType, 'number.integer' might be a separate keyword not automatically modifying 'number'

	// Attempt 1: Using the scope to resolve 'number.integer'
	// If 'number.integer' is defined in terms of the 'number' keyword in THIS scope, it might work.
	// However, standard keywords are usually pre-compiled.

	// Let's try to define a type that essentially means "number.integer" within this scope.
	// If we just use type("number.integer"), it likely pulls from the global/standard scope unless we override it too.

	const tInt = myScope.type("number.integer");
	const resInt = tInt("123");

	if (resInt instanceof type.errors) {
		console.log(
			"❌ Result: Validation FAILED. 'number.integer' did not accept string '123'.",
		);
		console.log("Error:", resInt.summary);
	} else {
		console.log(
			"✅ Result: Validation PASSED! 'number.integer' accepted and coerced '123'.",
		);
		console.log("Value:", resInt);
	}
} catch (e) {
	console.log("Error constructing type:", e);
}

console.log("\n--- Testing Explicit Intersection ---");
// Test if we can force it by saying "my number AND integer"
try {
	const tMixed = myScope.type("number").and("number.integer");
	// Wait, "number.integer" from standard scope expects number.
	// "number" from myScope produces number (after pipe).
	// So "string" -> [pipe] -> "number" -> [intersection] -> "number checked for integer"

	// BUT: "number.integer" might validate the INPUT, not the OUTPUT of the pipe if used directly?
	// Actually pipes produce a new type.

	const resMixed = tMixed("123");
	if (resMixed instanceof type.errors) {
		console.log("❌ Result (Intersection): Validation FAILED.");
		console.log("Error:", resMixed.summary);
	} else {
		console.log("✅ Result (Intersection): Validation PASSED!");
		console.log("Value:", resMixed);
	}
} catch (e) {
	console.log("Error constructing mixed type:", e);
}
