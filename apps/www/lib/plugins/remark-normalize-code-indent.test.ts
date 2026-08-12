import { describe, expect, it } from "vitest";
import { remarkNormalizeCodeIndent } from "./remark-normalize-code-indent";

describe("remarkNormalizeCodeIndent", () => {
	it("converts tabs to two spaces in fenced code nodes", () => {
		const tree = {
			type: "root",
			children: [
				{
					type: "code",
					lang: "ts",
					value: "export const Env = type({\n\tNODE_ENV: \"string\",\n});",
				},
			],
		};

		remarkNormalizeCodeIndent()(tree);

		expect(tree.children[0].value).toBe(
			'export const Env = type({\n  NODE_ENV: "string",\n});',
		);
	});
});
