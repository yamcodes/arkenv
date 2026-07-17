import { createConsoleLogger } from "./console-logger";
import type { Logger } from "./types";

/** Default logger instance used by static build log helpers. */
export let defaultLogger: Logger = createConsoleLogger();

/** Replace the module-level default logger reference. */
export function setDefaultLogger(logger: Logger): void {
	defaultLogger = logger;
}
