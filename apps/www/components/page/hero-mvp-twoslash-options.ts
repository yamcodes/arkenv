import path from "node:path";
import { arktypeTwoslashVfs, root, wwwRoot } from "~/lib/twoslash-vfs";

export type HeroTwoslashEngine = "arktype" | "standard";

export function heroTwoslashOptions(engine: HeroTwoslashEngine) {
	const compilerOptions = arktypeTwoslashVfs.compilerOptions;
	const paths = {
		...compilerOptions?.paths,
		"@/arkenv-internal": [
			path.join(root, "packages/nextjs/src/arkenv-internal.ts"),
		],
	};
	if (engine === "standard") {
		paths["@/generated/env.gen"] = [
			path.join(root, "packages/nextjs/src/standard/index.ts"),
		];
	}

	return {
		explicitTrigger: true as const,
		langs: ["ts"],
		throws: true,
		cacheDir: {
			cwd: wwwRoot,
			dir: `.next/cache/twoslash-hero-${engine}`,
		},
		twoslashOptions: {
			...arktypeTwoslashVfs,
			compilerOptions: {
				...compilerOptions,
				paths,
			},
		},
	};
}
