import { describe, expect, it } from "vitest";
import { mergeEnvExample } from "./merge-env-example";

describe("mergeEnvExample", () => {
	it("creates a file with keys in declaration order", () => {
		const result = mergeEnvExample(null, ["DATABASE_URL", "PORT", "CI"]);
		expect(result.status).toBe("created");
		expect(result.content).toBe("DATABASE_URL=\nPORT=\nCI=\n");
	});

	it("is unchanged when the file already matches the schema", () => {
		const existing = "DATABASE_URL=\nPORT=\n";
		expect(mergeEnvExample(existing, ["DATABASE_URL", "PORT"])).toEqual({
			content: existing,
			status: "unchanged",
		});
	});

	it("appends new keys and removes stale keys while preserving comments and values", () => {
		const existing = `# App
# Database connection
DATABASE_URL=postgres://localhost:5432/app

# Listening port
PORT=3000

# Removed later
OLD_KEY=gone
`;
		const result = mergeEnvExample(existing, [
			"DATABASE_URL",
			"PORT",
			"NODE_ENV",
		]);
		expect(result.status).toBe("updated");
		expect(result.content).toBe(`# App
# Database connection
DATABASE_URL=postgres://localhost:5432/app

# Listening port
PORT=3000
NODE_ENV=
`);
	});

	it("preserves export prefixes and quoted values", () => {
		const existing = `export HOST="localhost"\n`;
		const result = mergeEnvExample(existing, ["HOST", "PORT"]);
		expect(result.content).toBe(`export HOST="localhost"\nPORT=\n`);
	});

	it("creates an empty file for an empty schema", () => {
		expect(mergeEnvExample(null, [])).toEqual({
			content: "",
			status: "created",
		});
	});
});
