import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

interface AxeScanOptions {
	/** Tags to include in the scan (default: ["wcag2a", "wcag2aa", "wcag21aa"]) */
	tags?: string[];
	/** Selectors to exclude from the scan */
	exclude?: string[];
	/** Rules to disable for the scan */
	disableRules?: string[];
	/** List of violation IDs that are explicitly allowed (only applies to moderate/minor violations) */
	allowedViolations?: string[];
}

type ImpactLevel = "critical" | "serious" | "moderate" | "minor";

/**
 * Format violation details for error messages
 */
function formatViolationDetails(
	violations: Array<{
		id: string;
		impact?: ImpactLevel;
		description: string;
		nodes: Array<{ html: string }>;
	}>,
): string {
	return violations
		.map((violation) => {
			const impact = violation.impact
				? `[${violation.impact.toUpperCase()}] `
				: "";
			return `${impact}${violation.id}: ${violation.description}\n${violation.nodes
				.map((node) => `  - ${node.html}`)
				.join("\n")}`;
		})
		.join("\n\n");
}

/**
 * Run an a11y scan using axe-core and assert no violations.
 * Violations are gated by impact:
 * - critical|serious → CI fail
 * - moderate|minor → warn, allowed only if explicitly listed
 *
 * @param page - The Playwright page instance
 * @param options - Configuration options for the axe scan
 */
export async function assertNoA11yViolations(
	page: Page,
	options: AxeScanOptions = {},
): Promise<void> {
	const {
		tags = ["wcag2a", "wcag2aa", "wcag21aa"],
		exclude,
		disableRules,
		allowedViolations = [],
	} = options;

	let builder = new AxeBuilder({ page }).withTags(tags);

	if (exclude && exclude.length > 0) {
		builder = builder.exclude(exclude);
	}

	if (disableRules && disableRules.length > 0) {
		builder = builder.disableRules(disableRules);
	}

	const a11yScanResults = await builder.analyze();

	const allViolations = a11yScanResults.violations;

	// Separate violations by impact level
	const criticalSeriousViolations = allViolations.filter(
		(v) => v.impact === "critical" || v.impact === "serious",
	);

	const moderateMinorViolations = allViolations.filter(
		(v) => v.impact === "moderate" || v.impact === "minor",
	);

	// Filter out explicitly allowed violations from moderate/minor
	const unallowedModerateMinorViolations = moderateMinorViolations.filter(
		(v) => !allowedViolations.includes(v.id),
	);

	// Fail on critical/serious violations
	if (criticalSeriousViolations.length > 0) {
		const errorDetails = formatViolationDetails(criticalSeriousViolations);
		throw new Error(
			`Critical or serious a11y violations found:\n\n${errorDetails}`,
		);
	}

	// Warn and fail on unallowed moderate/minor violations
	if (unallowedModerateMinorViolations.length > 0) {
		const errorDetails = formatViolationDetails(
			unallowedModerateMinorViolations,
		);
		const allowedList =
			allowedViolations.length > 0
				? `\n\nAllowed violations: ${allowedViolations.join(", ")}`
				: "";
		throw new Error(
			`Moderate or minor a11y violations found (not explicitly allowed):\n\n${errorDetails}${allowedList}\n\nTo allow these violations, add their IDs to the 'allowedViolations' option.`,
		);
	}

	// If we get here, either:
	// - No violations found, OR
	// - Only moderate/minor violations that are explicitly allowed
	// Both cases are acceptable
}

