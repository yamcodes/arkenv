import {
	overwriteEnvSchemaFileStep,
	useEnvExampleStep,
} from "./steps/env-example";
import {
	envDtsHandlingStep,
	installTypeDefinitionsStep,
} from "./steps/env-types";
import { exampleStep } from "./steps/example";
import {
	bunBuildStep,
	frameworkStep,
	layoutStep,
	nextjsCodegenStep,
	validatorStep,
} from "./steps/framework";
import { hostPresetStep } from "./steps/host-preset";
import { pathStep, useDefaultPathStep } from "./steps/path";

/**
 * A collection of interactive CLI prompt steps used during initialization.
 */
export const steps = {
	example: exampleStep,
	overwriteEnvSchemaFile: overwriteEnvSchemaFileStep,
	framework: frameworkStep,
	bunBuild: bunBuildStep,
	layout: layoutStep,
	nextjsCodegen: nextjsCodegenStep,
	useDefaultPath: useDefaultPathStep,
	path: pathStep,
	installTypeDefinitions: installTypeDefinitionsStep,
	envDtsHandling: envDtsHandlingStep,
	validator: validatorStep,
	hostPreset: hostPresetStep,
	useEnvExample: useEnvExampleStep,
};
