import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env.CI);

// Worker configuration for parallel test execution
//
// Parallelization strategy:
// - CI: Tests are split into parallel jobs (a11y vs functional) via GitHub Actions matrix
// - Each job runs tests across 3 browsers (chromium, firefox, webkit) in parallel
// - Within each job, workers run multiple tests concurrently
//
// For CI, use 4 workers to allow parallel test execution across browsers
// For local, use 50% of CPU cores (Playwright's default calculation)
const getWorkers = () => {
	if (isCi) {
		// Allow override via environment variable
		const envWorkers = process.env.PLAYWRIGHT_WORKERS;
		if (envWorkers) {
			return Number.parseInt(envWorkers, 10);
		}
		// Default: 4 workers for CI (2x CPU cores, safe for resource usage)
		return 4;
	}
	// Local: use Playwright's default (50% of CPU cores)
	return undefined;
};

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: isCi,
	retries: isCi ? 2 : 0,
	workers: getWorkers(),
	// Reporter: dot/html for CI (less noise), list/html for local (immediate feedback)
	reporter: isCi
		? [["dot"], ["html", { open: "never" }]]
		: [["list"], ["html", { open: "on-failure" }]],
	// Test timeout: 60s for CI (networkidle waits, axe-core scans), 30s for local
	timeout: isCi ? 60_000 : 30_000,
	// Explicit expect timeout prevents flaky assertions
	expect: { timeout: 5_000 },
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		// Capture videos and screenshots only on failure to reduce CI artifact size
		video: "retain-on-failure",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],

	// Web server configuration
	// CI: Use production server (next start) for stability - requires pre-build in workflow
	// Local: Use dev server (next dev) for hot reload and better DX
	webServer: isCi
		? {
				// CI: Production server (faster, more stable, matches production)
				// Requires: pnpm --filter=www run build in GitHub Actions before tests
				command: "pnpm --filter=www run start",
				url: "http://localhost:3000",
				reuseExistingServer: false,
				timeout: 120_000, // 2min should be enough for production server
				stdout: "pipe",
				stderr: "pipe",
				env: { PORT: "3000" },
			}
		: {
				// Local: Dev server (hot reload, sourcemaps, better DX)
				command: "pnpm --filter=www run dev",
				url: "http://localhost:3000",
				reuseExistingServer: true,
				timeout: 120_000, // 2min for dev server cold start
				stdout: "pipe",
				stderr: "pipe",
				env: { PORT: "3000" },
			},
});
