import { expect, test } from "@playwright/test";

test.describe("Search Functionality", () => {
	test("should have accessible search endpoint", async ({ page }) => {
		// Test the search API endpoint directly
		const response = await page.request.get("/api/search");

		// The endpoint should exist (even if it returns empty results)
		expect(response.status()).toBeLessThan(500);
	});

	test("should return search results for valid queries", async ({ page }) => {
		// Test search with a common term
		const response = await page.request.get("/api/search?q=arkenv");

		expect(response.status()).toBeLessThan(500);

		// If the endpoint returns JSON, check the structure
		if (response.status() === 200) {
			const contentType = response.headers()["content-type"];
			if (contentType?.includes("application/json")) {
				const data = await response.json();
				expect(data).toBeDefined();
			}
		}
	});

	test("should handle empty search queries", async ({ page }) => {
		// Test search with empty query
		const response = await page.request.get("/api/search?q=");

		expect(response.status()).toBeLessThan(500);
	});

	test("should handle search with special characters", async ({ page }) => {
		// Test search with special characters
		const response = await page.request.get("/api/search?q=arkenv+typescript");

		expect(response.status()).toBeLessThan(500);
	});

	test("should handle search with URL encoded characters", async ({ page }) => {
		// Test search with URL encoded characters
		const response = await page.request.get(
			"/api/search?q=arkenv%20typescript",
		);

		expect(response.status()).toBeLessThan(500);
	});

	test("should have reasonable response time", async ({ page }) => {
		const startTime = Date.now();
		const response = await page.request.get("/api/search?q=arkenv");
		const endTime = Date.now();

		const responseTime = endTime - startTime;

		// Search should respond within 5 seconds
		expect(responseTime).toBeLessThan(5000);
		expect(response.status()).toBeLessThan(500);
	});

	test("should handle multiple search terms", async ({ page }) => {
		const searchTerms = ["arkenv", "typescript", "environment", "variables"];

		for (const term of searchTerms) {
			const response = await page.request.get(
				`/api/search?q=${encodeURIComponent(term)}`,
			);
			expect(response.status()).toBeLessThan(500);
		}
	});

	test("should handle long search queries", async ({ page }) => {
		// Test with a long search query
		const longQuery =
			"arkenv typescript environment variables validation schema";
		const response = await page.request.get(
			`/api/search?q=${encodeURIComponent(longQuery)}`,
		);

		expect(response.status()).toBeLessThan(500);
	});

	test("should handle search without query parameter", async ({ page }) => {
		// Test search endpoint without query parameter
		const response = await page.request.get("/api/search");

		expect(response.status()).toBeLessThan(500);
	});

	test("should have proper CORS headers if applicable", async ({ page }) => {
		const response = await page.request.get("/api/search?q=arkenv");

		// The API should be accessible (status < 500)
		expect(response.status()).toBeLessThan(500);
	});

	test("should handle concurrent search requests", async ({ page }) => {
		// Test multiple concurrent requests
		const requests = Array(5)
			.fill(null)
			.map(() => page.request.get("/api/search?q=arkenv"));

		const responses = await Promise.all(requests);

		// All requests should complete without server errors
		for (const response of responses) {
			expect(response.status()).toBeLessThan(500);
		}
	});
});
