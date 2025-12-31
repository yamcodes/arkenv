import { describe, expect, it } from "vitest";
import { isExternalUrl, optimizeInternalLink } from "./url";

describe("URL Utilities", () => {
	describe("isExternalUrl", () => {
		it("identifies internal relative paths", () => {
			expect(isExternalUrl("/docs/foo")).toBe(false);
			expect(isExternalUrl("#anchor")).toBe(false);
		});

		it("identifies explicitly internal domains", () => {
			expect(isExternalUrl("https://arkenv.js.org/docs")).toBe(false);
			expect(isExternalUrl("https://www.arkenv.js.org/docs")).toBe(false);
		});

		it("identifies external domains", () => {
			expect(isExternalUrl("https://google.com")).toBe(true);
			expect(isExternalUrl("https://arktype.io")).toBe(true);
		});

		it("identifies localhost as internal when running in client (jsdom)", () => {
			// In JSDOM/Client, if we are on localhost, pointing to localhost is internal.
			expect(isExternalUrl("http://localhost:3000")).toBe(false);
		});
	});

	describe("optimizeInternalLink", () => {
		it("optimizes production URLs to relative paths", () => {
			expect(
				optimizeInternalLink("https://arkenv.js.org/docs/quickstart"),
			).toBe("/docs/quickstart");
			expect(
				optimizeInternalLink("https://www.arkenv.js.org/login?foo=bar"),
			).toBe("/login?foo=bar");
		});

		it("preserves hash fragments", () => {
			expect(
				optimizeInternalLink(
					"https://arkenv.js.org/docs/quickstart#installation",
				),
			).toBe("/docs/quickstart#installation");
		});

		it("preserves external links", () => {
			expect(optimizeInternalLink("https://google.com")).toBe(
				"https://google.com",
			);
		});

		it("preserves localhost/IP links (tutorial mode)", () => {
			expect(optimizeInternalLink("http://localhost:3000/docs")).toBe(
				"http://localhost:3000/docs",
			);
			expect(optimizeInternalLink("http://127.0.0.1:8080/api")).toBe(
				"http://127.0.0.1:8080/api",
			);
		});

		it("preserves already relative paths", () => {
			expect(optimizeInternalLink("/docs/foo")).toBe("/docs/foo");
		});

		it("handles undefined", () => {
			expect(optimizeInternalLink(undefined)).toBeUndefined();
		});
	});
});
