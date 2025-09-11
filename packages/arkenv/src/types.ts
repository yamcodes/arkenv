import { type } from "arktype";

/**
 * A `string` that can be parsed into a number between 0 and 65535
 */
export const port = type("string", "=>", (data, ctx) => {
	const asNumber = Number.parseInt(data, 10);
	const isInteger = Number.isInteger(asNumber);
	const isBetween = 0 <= asNumber && asNumber <= 65535;
	if (!isInteger || !isBetween) {
		ctx.mustBe("an integer between 0 and 65535");
	}
	return asNumber;
});

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");

/**
 * A `string` that can be parsed into a boolean value
 * Accepts: "true", "false", "1", "0", "yes", "no", "on", "off" (case-insensitive)
 */
export const boolean = type("string", "=>", (data, ctx) => {
	const normalized = data.toLowerCase().trim();

	if (
		normalized === "true" ||
		normalized === "1" ||
		normalized === "yes" ||
		normalized === "on"
	) {
		return true;
	}

	if (
		normalized === "false" ||
		normalized === "0" ||
		normalized === "no" ||
		normalized === "off"
	) {
		return false;
	}

	ctx.mustBe("a boolean value (true, false, 1, 0, yes, no, on, off)");
});
