/** Standard prefix for ArkEnv build-time log messages. */
export const BUILD_PREFIX = "[ArkEnv]";

/** Format an error message with the standard build prefix. */
export function formatBuildError(message: string): string {
	return `${BUILD_PREFIX} ${message}`;
}
