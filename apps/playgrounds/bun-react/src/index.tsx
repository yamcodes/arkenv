import { serve } from "bun";
import index from "./index.html";

// Note: Plugins are also configured in bunfig.toml under [serve.static]
// for bundling client code. The validation above ensures env vars are present
// before the server starts.

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		"/*": index,

		"/api/hello": {
			async GET() {
				return Response.json({
					message: "Hello, world!",
					method: "GET",
				});
			},
			async PUT() {
				return Response.json({
					message: "Hello, world!",
					method: "PUT",
				});
			},
		},

		"/api/hello/:name": async (req) => {
			const name = req.params.name;
			return Response.json({
				message: `Hello, ${name}!`,
			});
		},
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
