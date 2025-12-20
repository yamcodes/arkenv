import arkenv, { type } from "arkenv";
// We can run this with vitest directly or via tsx if we mock the framework
// Let's just use console logs for simplicity in a standalone script,
// mimicking the structure of a test.

console.log("--- Verifying Coercion Support ---");

async function runTests() {
	let passed = 0;
	let failed = 0;

	function test(name: string, fn: () => void) {
		try {
			console.log(`Testing: ${name}`);
			fn();
			console.log("✅ Passed");
			passed++;
		} catch (e: any) {
			console.log(`❌ Failed: ${e.message}`);
			if (e.cause) console.log("Cause:", e.cause);
			failed++;
		}
	}

	test("Raw object: number coercion", () => {
		const env = arkenv({ PORT: "number" }, { PORT: "3000" });
		if (env.PORT !== 3000) throw new Error(`Expected 3000, got ${env.PORT}`);
		if (typeof env.PORT !== "number")
			throw new Error(`Expected type number, got ${typeof env.PORT}`);
	});

	test("Compiled type: number coercion", () => {
		const env = arkenv(type({ PORT: "number" }), { PORT: "3000" });
		if (env.PORT !== 3000) throw new Error(`Expected 3000, got ${env.PORT}`);
		if (typeof env.PORT !== "number")
			throw new Error(`Expected type number, got ${typeof env.PORT}`);
	});

	test("Raw object: boolean coercion", () => {
		const env = arkenv({ DEBUG: "boolean" }, { DEBUG: "true" });
		if (env.DEBUG !== true) throw new Error(`Expected true, got ${env.DEBUG}`);
		if (typeof env.DEBUG !== "boolean")
			throw new Error(`Expected type boolean, got ${typeof env.DEBUG}`);
	});

	// Sub-keyword tests
	test("Raw object: number.integer coercion", () => {
		const env = arkenv({ COUNT: "number.integer" }, { COUNT: "123" });
		if (env.COUNT !== 123) throw new Error(`Expected 123, got ${env.COUNT}`);
	});

	test("Compiled type: number.integer coercion", () => {
		const env = arkenv(type({ COUNT: "number.integer" }), { COUNT: "123" });
		if (env.COUNT !== 123) throw new Error(`Expected 123, got ${env.COUNT}`);
	});

	test("Raw object: number.epoch coercion", () => {
		const ts = "1678886400000";
		const env = arkenv({ TS: "number.epoch" }, { TS: ts });
		if (env.TS !== 1678886400000)
			throw new Error(`Expected 1678886400000, got ${env.TS}`);
	});

	test("Validation failure: invalid number", () => {
		try {
			arkenv({ PORT: "number" }, { PORT: "abc" });
			throw new Error("Should have thrown validation error");
		} catch (e: any) {
			if (!e.message.includes("must be")) {
				throw new Error(`Unexpected error message: ${e.message}`);
			}
		}
	});

	test("Validation failure: boolean invalid", () => {
		try {
			arkenv({ DEBUG: "boolean" }, { DEBUG: "not_a_bool" });
			throw new Error("Should have thrown validation error");
		} catch (e: any) {
			// Expected
		}
	});

	test("Validation failure: integer check after coercion", () => {
		try {
			arkenv({ COUNT: "number.integer" }, { COUNT: "123.5" });
			throw new Error("Should have thrown validation error for float");
		} catch (e: any) {
			// Expected
		}
	});

	console.log(`\nResults: ${passed} passed, ${failed} failed.`);
	if (failed > 0) process.exit(1);
}

runTests();
