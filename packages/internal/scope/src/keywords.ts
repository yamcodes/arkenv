import type { Type } from "arktype";
import { lazyKeyword } from "./utils";

/**
 * A `number` integer between 0 and 65535.
 */
export const port: Type<number, any> = lazyKeyword(({ type }) =>
	type("0 <= number.integer <= 65535"),
);

/**
 * An IP address or `"localhost"`
 */
export const host: Type<string, any> = lazyKeyword(({ type }) =>
	type("string.ip | 'localhost'"),
);
