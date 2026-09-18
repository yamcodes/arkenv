// @testing-library/jest-dom@7 augments vitest's Assertion<T>, but vitest 5
// changed that interface to Assertion<R, T>, so the published augmentation
// silently stops merging (testing-library/jest-dom#738). Extend vitest 5's
// Matchers extension point instead.
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
	interface Matchers<
		R extends void | Promise<void> = void | Promise<void>,
		T = unknown,
	> extends TestingLibraryMatchers<unknown, R> {}
}
