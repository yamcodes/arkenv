const fs = require("node:fs");
const path = require("node:path");

const METRICS_FILE = path.join(process.cwd(), ".github/deploy-metrics.json");
const LIMIT_24H_PREVIEW = 76;
const LIMIT_24H_PROD = 24;
const COOLDOWN_20M = 20 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const type = process.argv[2]; // 'preview' or 'prod'
const isDryRun = process.argv.includes("--dry-run");

function loadMetrics() {
	if (fs.existsSync(METRICS_FILE)) {
		try {
			return JSON.parse(fs.readFileSync(METRICS_FILE, "utf8"));
		} catch (e) {
			console.warn("Failed to parse metrics file, resetting.");
		}
	}
	return { preview: [], prod: [] };
}

function saveMetrics(metrics) {
	if (isDryRun) {
		console.log(
			"[Dry Run] Would save metrics:",
			JSON.stringify(metrics, null, 2),
		);
		return;
	}
	fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

function prune(timestamps) {
	const now = Date.now();
	return timestamps.filter((ts) => now - new Date(ts).getTime() < DAY_MS);
}

function formatDuration(ms) {
	const minutes = Math.ceil(ms / 60000);
	if (minutes >= 60) {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}
	return `${minutes}m`;
}

function emitOutput(key, value) {
	if (process.env.GITHUB_OUTPUT) {
		fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
	} else {
		console.log(`[Output] ${key}=${value}`);
	}
}

async function run() {
	if (!["preview", "prod"].includes(type)) {
		console.error('Invalid type. Use "preview" or "prod".');
		process.exit(1);
	}

	const metrics = loadMetrics();
	metrics.preview = prune(metrics.preview || []);
	metrics.prod = prune(metrics.prod || []);

	const now = Date.now();

	if (type === "preview") {
		let shouldDeploy = true;
		let reason = "ok";
		let remainingTime = "";

		// Check daily limit
		if (metrics.preview.length >= LIMIT_24H_PREVIEW) {
			shouldDeploy = false;
			reason = "limit";
			const oldest = new Date(metrics.preview[0]).getTime();
			remainingTime = formatDuration(DAY_MS - (now - oldest));
		}
		// Check cooldown
		else if (metrics.preview.length > 0) {
			const latest = new Date(
				metrics.preview[metrics.preview.length - 1],
			).getTime();
			const elapsed = now - latest;
			if (elapsed < COOLDOWN_20M) {
				shouldDeploy = false;
				reason = "cooldown";
				remainingTime = formatDuration(COOLDOWN_20M - elapsed);
			}
		}

		if (shouldDeploy) {
			metrics.preview.push(new Date(now).toISOString());
			saveMetrics(metrics);
		} else {
			console.log(
				`Preview deployment skipped. Reason: ${reason}. Remaining cooldown: ${remainingTime}`,
			);
		}

		emitOutput("should_deploy", shouldDeploy);
		emitOutput("reason", reason);
		emitOutput("remaining_time", remainingTime);
	} else {
		// Prod mode
		metrics.prod.push(new Date(now).toISOString());
		saveMetrics(metrics);

		const count = metrics.prod.length;
		if (count >= LIMIT_24H_PROD) {
			console.error(
				`Alert: Production deployment budget reached! (${count}/${LIMIT_24H_PROD} in 24h)`,
			);
			process.exit(1);
		}
		console.log(
			`Production deployment logged. (${count}/${LIMIT_24H_PROD} in 24h)`,
		);
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
