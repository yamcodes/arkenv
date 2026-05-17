import {
	overwriteEnvSchemaFileStep,
	useEnvExampleStep,
} from "./steps/env-example";
import {
	envDtsHandlingStep,
	installTypeDefinitionsStep,
} from "./steps/env-types";
import {
	bunFeaturesStep,
	frameworkStep,
	validatorStep,
} from "./steps/framework";
import { pathStep, useDefaultPathStep } from "./steps/path";

/**
 * A collection of interactive CLI prompt steps used during initialization.
 */
export const steps = {
	overwriteEnvSchemaFile: overwriteEnvSchemaFileStep,
	framework: frameworkStep,
	bunFeatures: bunFeaturesStep,
	useDefaultPath: useDefaultPathStep,
	path: pathStep,
	installTypeDefinitions: installTypeDefinitionsStep,
	envDtsHandling: envDtsHandlingStep,
	validator: validatorStep,
	useEnvExample: useEnvExampleStep,
};
