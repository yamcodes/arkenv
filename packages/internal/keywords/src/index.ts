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
 * A boolean that accepts string values and converts them to boolean
 * Accepts "true" or "false" strings and converts them to actual boolean values
 */
export const boolean = type(
	"'true' | 'false' | true | false",
	"=>",
	(str) => str === "true" || str === true,
);
