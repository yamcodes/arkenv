const { spawn } = require("node:child_process");

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error("No arguments provided to vercel-wrapper.cjs");
	process.exit(1);
}

const child = spawn("vercel", args, {
	stdio: ["inherit", "inherit", "pipe"],
});

let stderr = "";

child.stderr.on("data", (data) => {
	const str = data.toString();
	stderr += str;
	process.stderr.write(data);
});

child.on("close", (code) => {
	if (code !== 0) {
		const rateLimitKeywords = [
			"reached its daily deployment limit",
			"RATE_LIMIT_EXCEEDED",
			"Too many requests",
			"Deployment limit reached",
		];

		const isRateLimit = rateLimitKeywords.some((keyword) =>
			stderr.includes(keyword),
		);

		if (isRateLimit) {
			console.log(
				"\n::error title=Vercel Rate Limit Exceeded::Your Vercel account has reached a rate limit. Please check your Vercel dashboard or documentation for more information: https://vercel.com/docs/platform/limits",
			);
		}
	}
	process.exit(code);
});
