import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

describe("@arkenv/nextjs peerDependencies", () => {
	it("publishes a React range instead of the workspace catalog pin", () => {
		expect(packageJson.peerDependencies.react).toBe("^18.2.0 || ^19.0.0");
	});
});
