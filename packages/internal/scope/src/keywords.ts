import { keyword } from "./utils";

/**
 * A `number` integer between 0 and 65535.
 */
export const port = keyword(({ type }) => type("0 <= number.integer <= 65535"));

/**
 * An IP address or `"localhost"`
 */
export const host = keyword(({ type }) => type("string.ip | 'localhost'"));
