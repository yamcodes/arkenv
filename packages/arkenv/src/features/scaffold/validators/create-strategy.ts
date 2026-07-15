import { assembleSimpleFromDialect } from "./assemble-simple";
import { assembleStrictFromDialect } from "./assemble-strict";
import { DIALECTS } from "./dialects";
import type { Dialect } from "./dialects";
import type { ValidatorStrategy } from "./types";

/**
 * Build a {@link ValidatorStrategy} from a dialect.
 *
 * @param dialect Validator dialect supplying field formatting and wrappers.
 * @returns Strategy implementing simple and strict template generation.
 */
export function createValidatorStrategy(dialect: Dialect): ValidatorStrategy {
	return {
		formatField(key, role) {
			return dialect.formatStrictField(key, role);
		},

		getSimpleTemplate(keys, context) {
			return assembleSimpleFromDialect(dialect, keys, context);
		},

		getStrictTemplates(keys, context) {
			return assembleStrictFromDialect(dialect, keys, context);
		},
	};
}

export const arktypeStrategy = createValidatorStrategy(DIALECTS.arktype);
export const zodStrategy = createValidatorStrategy(DIALECTS.zod);
export const valibotStrategy = createValidatorStrategy(DIALECTS.valibot);
