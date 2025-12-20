import { type } from "arktype";
/**
 * **In**: A `number`, or a `string` that can be parsed into a `number`
 *
 * **Out**: A `number`
 */
export const parsedNumber = type("string | number")
	.pipe((s) => {
		if (typeof s === "number") return s;
		const n = Number(s);
		return Number.isNaN(n) ? s : n;
	})
	.narrow((data, ctx): data is number => {
		if (typeof data !== "number") {
			return ctx.mustBe("a number");
		}
		return true;
	});

/**
 * **In**: A `boolean`, or one of the following strings: `"true"`, `"false"`
 *
 * **Out**: A `boolean`
 */
export const parsedBoolean = type(
	"'true' | 'false' | true | false",
	"=>",
	(data) => data === "true" || data === true,
);

/**
 * A `number` (or a `string` to be parsed into a `number`) between 0 and 65535
 */
export const port = parsedNumber.narrow((data, ctx): data is number => {
	const isInteger = Number.isInteger(data);
	const isBetween = 0 <= data && data <= 65535;
	if (!isInteger || !isBetween) {
		ctx.mustBe("an integer between 0 and 65535");
	}
	return true;
});

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");
