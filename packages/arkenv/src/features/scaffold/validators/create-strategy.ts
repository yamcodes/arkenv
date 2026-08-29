import { assembleSimpleFromDialect } from "./assemble-simple";
import type { Dialect } from "./dialects";
import { DIALECTS } from "./dialects";
import type { ValidatorStrategy } from "./types";

/**
 * Build a {@link ValidatorStrategy} from a dialect.
 *
 * @param dialect Validator dialect supplying field formatting and wrappers.
 * @returns Strategy implementing single-file template generation.
 */
export function createValidatorStrategy(dialect: Dialect): ValidatorStrategy {
	return {
		getSimpleTemplate(keys, context) {
			return assembleSimpleFromDialect(dialect, keys, context);
		},
	};
}

export const arktypeStrategy = createValidatorStrategy(DIALECTS.arktype);
export const zodStrategy = createValidatorStrategy(DIALECTS.zod);
export const valibotStrategy = createValidatorStrategy(DIALECTS.valibot);
