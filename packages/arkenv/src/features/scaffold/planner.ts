import type { CollectedState, ScaffoldingPlan } from "./plan";
import {
	createExistingProjectPlan,
	createNewProjectPlan,
} from "./planner-helpers";

/**
 * Create a ScaffoldingPlan based on the collected workspace state.
 *
 * @param state The collected state of the workspace.
 * @returns The resulting scaffolding plan.
 */
export function createPlan(state: CollectedState): ScaffoldingPlan {
	if (state.mode === "new") {
		return createNewProjectPlan(state);
	}
	return createExistingProjectPlan(state);
}

export { stripValuesFromEnvContent } from "./planner-helpers";
