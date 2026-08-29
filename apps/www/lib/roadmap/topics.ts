/**
 * Public roadmap topic buckets (≤5). Derived from GitHub package/docs labels
 * with light title heuristics when labels are missing or ambiguous.
 */
export const ROADMAP_TOPICS = [
	"Core",
	"Standard",
	"Integrations",
	"CLI",
	"Docs",
] as const;

export type RoadmapTopic = (typeof ROADMAP_TOPICS)[number];

const INTEGRATION_LABELS = new Set([
	"@arkenv/nextjs",
	"@arkenv/nuxt",
	"@arkenv/vite-plugin",
	"@arkenv/bun-plugin",
]);

const CLI_LABELS = new Set(["@arkenv/cli"]);

const STANDARD_LABELS = new Set(["@arkenv/standard"]);

const DOCS_LABELS = new Set([
	"docs",
	"www",
	"marketing",
	"@arkenv/fumadocs-ui",
]);

/**
 * Strip repetitive milestone markers and conventional-commit category
 * prefixes from titles shown on `/roadmap`. Raw GitHub titles are unchanged
 * on GitHub itself.
 *
 * Examples: `(v1) docs: populate…` → `Populate…`; `feat(nuxt): add…` → `Add…`.
 */
export function displayTitle(title: string): string {
	const cleaned = title
		.replace(/\s*RFC\s*\(\s*v1\s*\)\s*:/gi, "RFC:")
		.replace(/\(\s*v1\s*\)/gi, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^[a-z][\w-]*(?:\([^)]*\))?:\s*/, "")
		.trim();
	if (cleaned.length === 0) return cleaned;
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Map an issue’s labels (and title fallbacks) to a roadmap topic.
 *
 * Priority: Integrations packages → CLI → Docs → Standard (title) → Core.
 * The bare `arkenv` label alone is not CLI (it was used product-wide); it
 * only tips CLI when the title mentions CLI / preset / scaffold work.
 */
export function topicFromIssue(
	labels: readonly string[],
	title: string,
): RoadmapTopic {
	if (labels.some((label) => INTEGRATION_LABELS.has(label))) {
		return "Integrations";
	}

	if (labels.some((label) => CLI_LABELS.has(label))) {
		return "CLI";
	}
	if (/\bCLI\b|arkenv init|scaffold|FrameworkStrategy/i.test(title)) {
		return "CLI";
	}
	// Historic `arkenv` label was product-wide; only tip CLI for preset work.
	if (labels.includes("arkenv") && /\bpresets?\b/i.test(title)) {
		return "CLI";
	}

	if (labels.some((label) => DOCS_LABELS.has(label))) {
		return "Docs";
	}

	if (labels.some((label) => STANDARD_LABELS.has(label))) {
		return "Standard";
	}

	if (
		/standard schema|validator mode|@arkenv\/standard|\/standard\b/i.test(title)
	) {
		return "Standard";
	}

	if (/^feat\((nuxt|nextjs|vite|bun)/i.test(title)) {
		return "Integrations";
	}

	return "Core";
}

/**
 * Group items by topic in `ROADMAP_TOPICS` order; omit empty buckets.
 */
export function groupByTopic<T extends { topic: RoadmapTopic }>(
	items: readonly T[],
): { topic: RoadmapTopic; items: T[] }[] {
	const buckets = new Map<RoadmapTopic, T[]>(
		ROADMAP_TOPICS.map((topic) => [topic, []]),
	);
	for (const item of items) {
		buckets.get(item.topic)?.push(item);
	}
	return ROADMAP_TOPICS.flatMap((topic) => {
		const group = buckets.get(topic) ?? [];
		return group.length > 0 ? [{ topic, items: group }] : [];
	});
}
