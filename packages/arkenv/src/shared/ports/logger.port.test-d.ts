import type { Logger } from "@repo/log";
import { expectTypeOf, it } from "vitest";
import type { LoggerPort } from "./logger.port";

it("LoggerPort structurally satisfies the shared Logger interface", () => {
	expectTypeOf<LoggerPort>().toExtend<Logger>();
});
