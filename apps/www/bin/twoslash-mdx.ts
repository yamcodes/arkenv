import fs from "node:fs";
import { twoslasher } from "twoslash";
import { arktypeTwoslashOptions } from "../lib/twoslash-options";

const mdxPath = process.argv[2];
if (!mdxPath) {
	console.error("Usage: tsx twoslash-mdx.ts <path-to-mdx>");
	process.exit(1);
}

const content = fs.readFileSync(mdxPath, "utf8");

// Use the shared options, but we need the inner twoslashOptions property
// which contains compilerOptions, extraFiles, etc.
const options = arktypeTwoslashOptions.twoslashOptions;

const codeBlockRegex = /```ts twoslash(?:.*)\n([\s\S]*?)\n```/g;
let match;
let blockIndex = 1;

while ((match = codeBlockRegex.exec(content)) !== null) {
	const code = match[1];
	console.log(`\n--- Block ${blockIndex++} ---`);
	try {
		const result = twoslasher(code, "ts", options);

		console.log("Hovers:");
		result.hovers.forEach((h: any) => {
			if ((arktypeTwoslashOptions as any).filterNode?.(h) !== false) {
				console.log(`  [${h.line}:${h.character}] ${h.text}`);
			}
		});

		if (result.errors.length > 0) {
			console.log("Errors:");
			result.errors.forEach((e: any) => {
				if ((arktypeTwoslashOptions as any).filterNode?.(e) !== false) {
					console.log(`  [${e.line}:${e.character}] ${e.text}`);
				}
			});
		}
	} catch (e) {
		console.error("Twoslash error:", e);
	}
}
