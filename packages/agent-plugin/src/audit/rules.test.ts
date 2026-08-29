import { describe, expect, it } from "vitest";
import {
	hasPublicPrefix,
	isClientFile,
	isEnvModule,
	isPrefixViolation,
	looksLikeSecret,
} from "./rules";

describe("rules", () => {
	it("classifies env modules", () => {
		expect(isEnvModule("src/env.ts")).toBe(true);
		expect(isEnvModule("env/client.ts")).toBe(true);
		expect(isEnvModule("env/server.ts")).toBe(true);
		expect(isEnvModule("env/internal/shared.ts")).toBe(false);
		expect(isEnvModule("src/app.ts")).toBe(false);
	});

	it("detects client files", () => {
		expect(isClientFile("header.tsx", `"use client";\nexport {}\n`)).toBe(true);
		expect(isClientFile("widget.client.ts", "export {}\n")).toBe(true);
		expect(isClientFile("server.ts", "export {}\n")).toBe(false);
	});

	it("detects public prefixes and secrets", () => {
		expect(hasPublicPrefix("NEXT_PUBLIC_SITE_URL")).toBe(true);
		expect(hasPublicPrefix("DATABASE_URL")).toBe(false);
		expect(looksLikeSecret("DATABASE_URL")).toBe(true);
		expect(looksLikeSecret("STRIPE_SECRET")).toBe(true);
		expect(isPrefixViolation("NEXT_PUBLIC_DATABASE_URL")).toBe(true);
		expect(isPrefixViolation("VITE_STRIPE_SECRET")).toBe(true);
		expect(isPrefixViolation("NEXT_PUBLIC_SITE_URL")).toBe(false);
	});
});
