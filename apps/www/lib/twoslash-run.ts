import {
	type TransformerTwoslashOptions,
	transformerTwoslash,
} from "fumadocs-twoslash";
import { codeToHtml, type ShikiTransformer } from "shiki";
import { arktypeTwoslashOptions } from "./twoslash-options";

export type TwoslashRunNode = {
	type: string;
	text?: string;
	docs?: string;
	line: number;
	character: number;
	code?: number;
	target?: string;
};

export type TwoslashRunResult = {
	code: string;
	nodes: TwoslashRunNode[];
};

/**
 * Run a fence through `fumadocs-twoslash`'s Shiki transformer.
 *
 * @param code Source to typecheck
 * @param lang Fence language
 * @param options Transformer options, including the shared virtual compiler
 * @returns Analyzed code and Twoslash nodes
 * @throws When Twoslash rejects the sample or the transformer returns nothing
 */
export async function runTwoslash(
	code: string,
	lang = "ts",
	options: TransformerTwoslashOptions = arktypeTwoslashOptions,
): Promise<TwoslashRunResult> {
	let captured: TwoslashRunResult | undefined;
	const capture: ShikiTransformer = {
		name: "arkenv:capture-twoslash",
		preprocess() {
			const result = this.meta.twoslash;
			if (result) captured = result;
		},
	};

	await codeToHtml(code, {
		lang,
		theme: "github-dark",
		meta: { __raw: "twoslash" },
		transformers: [transformerTwoslash(options), capture],
	});

	if (!captured) {
		throw new Error("Twoslash did not return a result");
	}
	return captured;
}
