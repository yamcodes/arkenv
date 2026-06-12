import { watch as chokidarWatch } from "chokidar";
import { runCodegen } from "./codegen";
import type { LayoutMode, Logger } from "./types";

declare global {
	// eslint-disable-next-line no-var
	var __arkenv_nuxt_watcher__: import("chokidar").FSWatcher | undefined;
}

/**
 * Watch the schema file(s) for changes and automatically run codegen to update output.
 *
 * @param schemaPath The absolute path or list of paths of schema files to watch
 * @param outputPath The absolute path where the generated code should be written
 * @param layout The layout option to pass to codegen
 * @param logger An optional logger instance to record error messages
 */
export function watchSchema(
	schemaPath: string | string[],
	outputPath: string,
	layout?: LayoutMode,
	logger?: Logger,
): void {
	const previousWatcher = globalThis.__arkenv_nuxt_watcher__;

	const startWatch = () => {
		try {
			const watcher = chokidarWatch(schemaPath, { ignoreInitial: true });
			globalThis.__arkenv_nuxt_watcher__ = watcher;

			watcher.on("change", () => {
				try {
					const mainSchemaPath = Array.isArray(schemaPath)
						? schemaPath[0]
						: schemaPath;
					runCodegen(mainSchemaPath, outputPath, layout);
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					if (logger) {
						logger.error(`Failed to regenerate env.gen.ts: ${message}`);
					} else {
						console.error(
							`[ArkEnv Watcher] Failed to regenerate env.gen.ts: ${message}`,
						);
					}
				}
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			if (logger) {
				logger.error(`Failed to start watch on ${schemaPath}: ${message}`);
			} else {
				console.error(
					`[ArkEnv Watcher] Failed to start watch on ${schemaPath}: ${message}`,
				);
			}
		}
	};

	if (previousWatcher && typeof previousWatcher.close === "function") {
		previousWatcher
			.close()
			.catch((err: unknown) => {
				const message = err instanceof Error ? err.message : String(err);
				if (logger) {
					logger.error(`Failed to close previous watcher: ${message}`);
				} else {
					console.error(
						`[ArkEnv Watcher] Failed to close previous watcher: ${message}`,
					);
				}
			})
			.finally(() => {
				startWatch();
			});
	} else {
		startWatch();
	}
}

/**
 * Close the schema watcher if one is running.
 *
 * @param logger An optional logger instance to record errors
 */
export async function closeWatcher(logger?: Logger): Promise<void> {
	const watcher = globalThis.__arkenv_nuxt_watcher__;
	if (watcher && typeof watcher.close === "function") {
		try {
			await watcher.close();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			if (logger) {
				logger.error(`Failed to close watcher: ${message}`);
			} else {
				console.error(`[ArkEnv Watcher] Failed to close watcher: ${message}`);
			}
		} finally {
			globalThis.__arkenv_nuxt_watcher__ = undefined;
		}
	}
}
