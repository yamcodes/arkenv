import { type } from "arktype";
import {
	maybeBooleanFunction,
	maybeJsonFunction,
	maybeNumberFunction,
} from "./functions";

/**
 * A loose numeric morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A `number` if the input is a numeric string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-numeric strings would block other branches.
 */
export const maybeNumber = type("unknown").pipe(maybeNumberFunction);

/**
 * A loose boolean morph.
 *
 * **In**: `unknown`
 *
 * **Out**: `true` for `"true"`, `false` for `"false"`; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-boolean strings would block other branches.
 */
export const maybeBoolean = type("unknown").pipe(maybeBooleanFunction);

/**
 * A `number` integer between 0 and 65535.
 */
export const port = type("0 <= number.integer <= 65535");

/**
 * An IP address or `"localhost"`
 */
export const host = type("string.ip | 'localhost'");

/**
 * A loose JSON morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A parsed JSON object if the input is a valid JSON string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-JSON strings would block other branches.
 */
export const maybeJson = type("unknown").pipe(maybeJsonFunction);
