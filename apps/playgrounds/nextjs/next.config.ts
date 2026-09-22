import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withArkEnv } from "@arkenv/nextjs/config";
import type { NextConfig } from "next";

const playgroundRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(playgroundRoot, "../../..");
const isArkEnvMonorepo =
	fs.existsSync(path.join(monorepoRoot, "nub.lock")) ||
	fs.existsSync(path.join(monorepoRoot, "pnpm-lock.yaml"));

const nextConfig: NextConfig = isArkEnvMonorepo
	? {
			// Isolated Nub `.store` keeps `next` outside this package via symlink.
			// Turbopack refuses packages outside `turbopack.root`, so pin the
			// monorepo root (no-op for standalone examples synced from here).
			turbopack: {
				root: monorepoRoot,
			},
			outputFileTracingRoot: monorepoRoot,
		}
	: {
			/* config options here */
		};

export default withArkEnv(nextConfig);
