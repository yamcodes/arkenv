import type { SizeInBytes, SizeLimitResult } from "./types.ts";
import { calculateDiff, parseSizeToBytes } from "./utils/size.ts";

// Calculate diffs and add to results
export const calculateDiffs = (
	results: SizeLimitResult[],
	baselineSizes: Map<string, SizeInBytes>,
	isReleasePR: boolean,
): void => {
	for (const result of results) {
		const key = `${result.package}:${result.file}`;
		const currentSizeBytes = parseSizeToBytes(result.size);
		let baselineSize = baselineSizes.get(key);
		let matchedKey = key;

		// If not found, try alternative key formats (for backwards compatibility)
		// e.g., if current has "index.js" but baseline has "bundle", or vice versa
		if (baselineSize === undefined && baselineSizes.size > 0) {
			// Try with "bundle" as fallback filename (for old baselines that used "bundle")
			const bundleKey = `${result.package}:bundle`;
			baselineSize = baselineSizes.get(bundleKey);
			if (baselineSize !== undefined) {
				matchedKey = bundleKey;
			}

			// If still not found, try to find any file for this package
			// This handles cases where filename format changed between baseline and current
			if (baselineSize === undefined) {
				for (const [baselineKey, size] of baselineSizes.entries()) {
					if (baselineKey.startsWith(`${result.package}:`)) {
						baselineSize = size;
						matchedKey = baselineKey;
						break;
					}
				}
			}
		}

		if (baselineSize !== undefined) {
			const diff = calculateDiff(currentSizeBytes, baselineSize);
			result.diff = diff;

			// Log detailed diff calculation for release PRs
			if (isReleasePR) {
				console.log(`🔍 Diff calculation for ${key}:`);
				console.log(`  - Baseline (${matchedKey}): ${baselineSize} bytes`);
				console.log(`  - Current (${key}): ${currentSizeBytes} bytes`);
				console.log(`  - Difference: ${currentSizeBytes - baselineSize} bytes`);
				console.log(`  - Percentage: ${diff}`);
			}
		} else {
			// Only log if there's an issue (can't compute diff)
			if (baselineSizes.size > 0) {
				const availableKeys = Array.from(baselineSizes.keys()).join(", ");
				console.log(
					`⚠️ No baseline found for ${key}. Available keys: ${availableKeys}`,
				);
			} else {
				console.log(
					`⚠️ No baseline found for ${key}. Baseline map is empty (size: ${baselineSizes.size}).`,
				);
			}
			result.diff = "—";
		}
	}
};

// Filter results to only include changed packages
export const filterChangedPackages = (
	results: SizeLimitResult[],
	changedPackages: Set<string> | null,
): SizeLimitResult[] => {
	if (!changedPackages || changedPackages.size === 0) {
		return results;
	}

	const filtered = results.filter((result) =>
		changedPackages.has(result.package),
	);
	console.log(
		`📊 Filtered results: ${filtered.length} of ${results.length} packages changed`,
	);
	return filtered;
};

// Log baseline and current sizes for debugging (especially for release PRs)
export const logDebugInfo = (
	results: SizeLimitResult[],
	baselineSizes: Map<string, SizeInBytes>,
	isReleasePR: boolean,
): void => {
	if (isReleasePR && baselineSizes.size > 0) {
		console.log("\n📊 Baseline sizes from npm:");
		for (const [key, size] of baselineSizes.entries()) {
			console.log(`  - ${key}: ${size} bytes`);
		}
		console.log("\n📊 Current sizes from size-limit:");
		for (const result of results) {
			const currentSizeBytes = parseSizeToBytes(result.size);
			console.log(
				`  - ${result.package}:${result.file}: ${currentSizeBytes} bytes (${result.size})`,
			);
		}
		console.log("");
	}
};
