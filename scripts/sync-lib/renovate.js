import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR } from "./constants.js";

const RENOVATE_CONFIG_PATH = join(ROOT_DIR, ".github", "renovate.json");
const START_MARKER = "// BEGIN GENERATED SYNC EXAMPLES";
const END_MARKER = "// END GENERATED SYNC EXAMPLES";

/**
 * Emit generated `matchFileNames` entries with the trailing comma omitted
 * from the final entry so the generated JSONC remains parseable.
 *
 * @param {string[]} exampleNames
 */
export function generatedMatchFileNames(exampleNames) {
	return [
		`\t\t\t\t${START_MARKER}`,
		...exampleNames.map(
			(name, index) =>
				`\t\t\t\t"examples/${name}/**"${index === exampleNames.length - 1 ? "" : ","}`,
		),
		`\t\t\t\t${END_MARKER}`,
	].join("\n");
}

/**
 * Keep Renovate's generated-example exclusion in sync with playground metadata.
 */
export function syncRenovateConfig(exampleNames, checkOnly = false) {
	const content = readFileSync(RENOVATE_CONFIG_PATH, "utf8");
	const markerStart = content.indexOf(START_MARKER);
	const start = content.lastIndexOf("\n", markerStart) + 1;
	const end = content.indexOf(END_MARKER);

	if (markerStart === -1 || end === -1 || end < start) {
		throw new Error(
			`Renovate config must contain ${START_MARKER} and ${END_MARKER}`,
		);
	}

	const generated = generatedMatchFileNames([...new Set(exampleNames)].sort());
	const current = content.slice(start, end + END_MARKER.length);
	const updated =
		content.slice(0, start) +
		generated +
		content.slice(end + END_MARKER.length);

	if (checkOnly) {
		return current !== generated;
	}

	if (current !== generated) {
		writeFileSync(RENOVATE_CONFIG_PATH, updated);
	}

	return false;
}
