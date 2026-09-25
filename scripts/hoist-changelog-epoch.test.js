import { describe, expect, it } from "vitest";
import { hoistEpochBanner } from "./hoist-changelog-epoch.js";

const banner = `<!-- arkenv-epoch -->
> **v1 package identity.** \`arkenv\` is the CLI.
<!-- /arkenv-epoch -->`;

describe("hoistEpochBanner", () => {
	it("leaves a banner that is already under the heading", () => {
		const markdown = `# arkenv

${banner}

## 1.0.0-rc.2
`;
		expect(hoistEpochBanner(markdown)).toBe(markdown);
	});

	it("moves the banner back above a release Changesets just inserted", () => {
		const buried = `# arkenv

## 1.0.0-rc.3

### Patch Changes

- note

${banner}

## 1.0.0-rc.2
`;
		expect(hoistEpochBanner(buried)).toBe(`# arkenv

${banner}

## 1.0.0-rc.3

### Patch Changes

- note

## 1.0.0-rc.2
`);
	});

	it("returns the file unchanged when the markers are missing", () => {
		const markdown = "# arkenv\n\n## 1.0.0-rc.2\n";
		expect(hoistEpochBanner(markdown)).toBe(markdown);
	});
});
