// TODO: These are not actually "keywords". Find a better name for these.

import { type } from "arktype";

/**
 * A `string` that can be parsed into a number between 0 and 65535
 */
export const port = type("string.integer").pipe(
	(str) => Number.parseInt(str),
	type("0 <= number <= 65535"),
);

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");
