import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn utility", () => {
	it("should merge class names", () => {
		const result = cn("text-red-500", "bg-blue-500");
		expect(result).toBe("text-red-500 bg-blue-500");
	});

	it("should handle conditional classes", () => {
		const result = cn("text-red-500", true && "bg-blue-500", false && "hidden");
		expect(result).toBe("text-red-500 bg-blue-500");
	});

	it("should handle arrays of classes", () => {
		const result = cn(["text-red-500", "font-bold"], "bg-blue-500");
		expect(result).toBe("text-red-500 font-bold bg-blue-500");
	});

	it("should handle objects with boolean values", () => {
		const result = cn({
			"text-red-500": true,
			"bg-blue-500": false,
			"font-bold": true,
		});
		expect(result).toBe("text-red-500 font-bold");
	});

	it("should merge conflicting Tailwind classes (tailwind-merge behavior)", () => {
		const result = cn("text-red-500", "text-blue-500");
		expect(result).toBe("text-blue-500");
	});

	it("should handle undefined and null values", () => {
		const result = cn("text-red-500", undefined, null, "bg-blue-500");
		expect(result).toBe("text-red-500 bg-blue-500");
	});

	it("should handle empty string", () => {
		const result = cn("", "text-red-500");
		expect(result).toBe("text-red-500");
	});

	it("should handle no arguments", () => {
		const result = cn();
		expect(result).toBe("");
	});

	it("should deduplicate classes", () => {
		const result = cn("text-red-500", "text-red-500", "bg-blue-500");
		expect(result).toBe("text-red-500 bg-blue-500");
	});

	it("should handle complex mixed inputs", () => {
		const result = cn(
			"text-red-500",
			["bg-blue-500", { "font-bold": true, italic: false }],
			undefined,
			"hover:text-white",
		);
		expect(result).toBe("text-red-500 bg-blue-500 font-bold hover:text-white");
	});
});
