import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

describe("@arkenv/nextjs peerDependencies", () => {
	it("publishes a React range instead of the workspace catalog pin", () => {
		expect(packageJson.peerDependencies.react).toBe("^18.2.0 || ^19.0.0");
	});
});

describe("@arkenv/nextjs exports", () => {
	it("publishes react-server and default conditions on ./standard", () => {
		expect(packageJson.exports["./standard"]).toEqual({
			"react-server": {
				types: "./dist/standard/react-server.d.ts",
				import: "./dist/standard/react-server.js",
				default: "./dist/standard/react-server.js",
			},
			default: {
				types: "./dist/standard/index.d.ts",
				import: "./dist/standard/index.js",
				default: "./dist/standard/index.js",
			},
		});
	});
});
