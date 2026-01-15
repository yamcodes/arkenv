import { type } from "arktype";

/**
 * A `number` integer between 0 and 65535.
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");
