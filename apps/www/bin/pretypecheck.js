#!/usr/bin/env node
/**
 * Best-effort env codegen before `tsc`. setupArkEnv calls process.exit(1) on
 * validation / missing-dist failures; turn that into a throw so this script
 * can exit 0 and typecheck can still run when dist is briefly unrestored.
 */
const realExit = process.exit.bind(process);
process.exit = (code) => {
	if (code && code !== 0) {
		throw new Error(`setupArkEnv exited with ${code}`);
	}
	return realExit(code);
};

try {
	require("@arkenv/nextjs/config").setupArkEnv({ schemaPath: "./env.ts" });
} catch {
	// ignore — typecheck does not require a fresh env.gen.ts
} finally {
	process.exit = realExit;
}
