import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Limit test failures to prevent runaway failures */
	maxFailures: 5,
	/* Timeout for each test in milliseconds */
	timeout: process.env.CI ? 300000 : 60000, // 5 minutes on CI, 1 minute locally
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: "html",
	/* Output directory for test artifacts */
	outputDir: "./tests/test-results",
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:3000",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Global timeout configuration */
		actionTimeout: 15000,
		navigationTimeout: 30000,
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				// Firefox-specific timeout configuration
				actionTimeout: 15000,
				navigationTimeout: 30000,
			},
		},

		// WebKit is disabled on WSL2/Linux due to stability issues
		// Uncomment the following block if running on macOS or native Linux
		// {
		// 	name: "webkit",
		// 	use: {
		// 		...devices["Desktop Safari"],
		// 		// WebKit-specific timeout configuration
		// 		actionTimeout: 90000, // Increased timeout for WebKit
		// 		navigationTimeout: 90000,
		// 		// WebKit-specific launch options for WSL2/Linux
		// 		launchOptions: {
		// 			args: [
		// 				'--no-sandbox',
		// 				'--disable-setuid-sandbox',
		// 				'--disable-dev-shm-usage',
		// 				'--disable-gpu',
		// 				'--disable-web-security',
		// 				'--disable-features=VizDisplayCompositor'
		// 			],
		// 		},
		// 	},
		// 	// WebKit-specific: Run with reduced parallelism for stability
		// 	fullyParallel: false,
		// 	workers: 1,
		// },

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: "pnpm --filter=www run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
