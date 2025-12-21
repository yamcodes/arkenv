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
 * A `number` integer between 0 and 65535
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");
