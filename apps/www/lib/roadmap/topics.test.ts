import { describe, expect, it } from "vitest";
import { displayTitle, groupByTopic, topicFromIssue } from "./topics";

describe("displayTitle", () => {
	it("strips (v1) markers and leading Label: prefixes, then capitalizes", () => {
		expect(displayTitle("(v1) docs: populate Getting started")).toBe(
			"Populate Getting started",
		);
		expect(displayTitle("(v1) docs: populate Core concepts pages")).toBe(
			"Populate Core concepts pages",
		);
		expect(displayTitle("feat(nuxt): introduce @arkenv/nuxt package")).toBe(
			"Introduce @arkenv/nuxt package",
		);
		expect(displayTitle("RFC(v1): Replace strict layout")).toBe(
			"Replace strict layout",
		);
		expect(displayTitle("RFC: Next.js integration")).toBe(
			"Next.js integration",
		);
		expect(
			displayTitle(
				"API: Rename underlying core function to arkenv and expose as default export",
			),
		).toBe(
			"Rename underlying core function to arkenv and expose as default export",
		);
		expect(displayTitle("Tracking: Nuxt Integration Parity")).toBe(
			"Nuxt Integration Parity",
		);
		expect(displayTitle("Hosting presets Phase 4 (#1450)")).toBe(
			"Hosting presets Phase 4",
		);
		expect(
			displayTitle(
				"(v1) Forward-port: hosting presets Phase 4 (#1450)",
			),
		).toBe("Hosting presets Phase 4");
		expect(displayTitle("Coercion (string→number)")).toBe(
			"Coercion (string→number)",
		);
		expect(
			displayTitle(
				"RFC: arkenv init: interactive scaffold CLI for onboarding",
			),
		).toBe("arkenv init: interactive scaffold CLI for onboarding");
	});
});

describe("topicFromIssue", () => {
	it("prefers integration package labels", () => {
		expect(
			topicFromIssue(["@arkenv/nextjs", "docs"], "(v1) docs-ish next work"),
		).toBe("Integrations");
	});

	it("maps CLI labels and CLI-ish titles", () => {
		expect(topicFromIssue(["@arkenv/cli"], "hosting presets Phase 4")).toBe(
			"CLI",
		);
		expect(topicFromIssue([], "Harden CLI runtime import guard")).toBe("CLI");
		expect(
			topicFromIssue(["arkenv"], "(v1) Forward-port hosting presets"),
		).toBe("CLI");
	});

	it("maps docs / www / fumadocs to Docs", () => {
		expect(topicFromIssue(["docs", "www"], "populate Core concepts")).toBe(
			"Docs",
		);
		expect(
			topicFromIssue(["www", "@arkenv/fumadocs-ui"], "Fix bad search UX"),
		).toBe("Docs");
	});

	it("maps @arkenv/standard label and Standard Schema titles", () => {
		expect(
			topicFromIssue(
				["@arkenv/standard"],
				'(v1) RFC: Revisit Valibot DX so "No boilerplate" stays honest',
			),
		).toBe("Standard");
		expect(topicFromIssue([], "Validator mode (make ArkType optional)")).toBe(
			"Standard",
		);
	});

	it("falls back to Core", () => {
		expect(topicFromIssue([], "Unify error normalization")).toBe("Core");
		expect(topicFromIssue(["arkenv"], "Coercion (string→number)")).toBe("Core");
	});

	it("infers Integrations from conventional-commit scopes", () => {
		expect(
			topicFromIssue([], "feat(nuxt): introduce @arkenv/nuxt package"),
		).toBe("Integrations");
	});
});

describe("groupByTopic", () => {
	it("keeps ROADMAP_TOPICS order and drops empty buckets", () => {
		const groups = groupByTopic([
			{ id: "a", topic: "Docs" as const },
			{ id: "b", topic: "Core" as const },
			{ id: "c", topic: "Docs" as const },
		]);
		expect(groups.map((g) => g.topic)).toEqual(["Core", "Docs"]);
		expect(groups[0]?.items.map((i) => i.id)).toEqual(["b"]);
		expect(groups[1]?.items.map((i) => i.id)).toEqual(["a", "c"]);
	});
});
