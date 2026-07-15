import { afterEach, beforeEach } from "vitest";
import { configureDefaultLogger } from "./src/default-logger";

beforeEach(() => {
	configureDefaultLogger({ level: "info" });
});

afterEach(() => {
	configureDefaultLogger({ level: "info" });
});
