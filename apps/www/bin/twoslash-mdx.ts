// biome-ignore-all lint/suspicious/noConsole: This is a CLI debugging script
import fs from "node:fs";
import { runTwoslash } from "~/lib/twoslash-run";

const mdxPath = process.argv[2];
if (!mdxPath) {
	console.error("Usage: nub twoslash-mdx.ts <path-to-mdx>");
	process.exit(1);
}

const content = fs.readFileSync(mdxPath, "utf8");

const codeBlockRegex =
	/```(ts|tsx|js|jsx)(?:[ \t]+[^\n]*?)?[ \t]+twoslash(?:[ \t]+[^\n]*?)?\r?\n([\s\S]*?)\r?\n[ \t]*```/g;

/**
 * Typecheck every `twoslash` fence in an MDX file and print hovers and errors.
 */
async function main() {
	let blockIndex = 1;
	for (const match of content.matchAll(codeBlockRegex)) {
		const lang = match[1] ?? "ts";
		const code = match[2];
		if (code === undefined) continue;
		console.log(`\n--- Block ${blockIndex++} ---`);
		try {
			const result = await runTwoslash(code, lang);
			console.log("Hovers:");
			for (const node of result.nodes) {
				if (node.type !== "hover" && node.type !== "query") continue;
				console.log(`  [${node.line}:${node.character}] ${node.text}`);
				if (node.docs) {
					console.log(`      Docs: ${node.docs}`);
				}
			}

			const errors = result.nodes.filter((node) => node.type === "error");
			if (errors.length > 0) {
				console.log("Errors:");
				for (const node of errors) {
					console.log(`  [${node.line}:${node.character}] ${node.text}`);
				}
			}
		} catch (e) {
			console.error("Twoslash error:", e);
		}
	}
}

await main();
