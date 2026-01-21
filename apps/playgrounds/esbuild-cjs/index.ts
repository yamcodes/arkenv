import arkenv from "arkenv";

console.log("Loading environment...");

try {
	const env = arkenv(
		{
			PORT: "number.port",
			HOST: "string.host",
		},
		{
			env: {
				PORT: "3000",
				HOST: "localhost",
			},
		},
	);

	console.log("Environment loaded successfully:", env);
	process.exit(0);
} catch (e) {
	console.error("Failed to load environment:");
	console.error(e);
	process.exit(1);
}
