import type { Validator } from "@/features/scaffold/plan";
import { arktypeDialect } from "./arktype";
import type { Dialect } from "./types";
import { valibotDialect } from "./valibot";
import { zodDialect } from "./zod";

/**
 * Exhaustive registry of validator dialects.
 */
export const DIALECTS = {
	arktype: arktypeDialect,
	zod: zodDialect,
	valibot: valibotDialect,
} as const satisfies Record<Validator, Dialect>;

export type { Dialect } from "./types";
