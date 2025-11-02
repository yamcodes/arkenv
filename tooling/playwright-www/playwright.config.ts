import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env.CI);

// Use 2-3x CPU cores for workers (GitHub Actions ubuntu-latest has 2 cores)
// For CI, use 4 workers to allow parallel test execution
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
	reporter: "html",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
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

	webServer: {
		command: "pnpm --filter=www run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !isCi,
	},
});
