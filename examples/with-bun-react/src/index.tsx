import { serve } from "bun";
import { env } from "./env";
import index from "./index.html";

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		"/*": index,

		"/api/hello": {
			async GET() {
				return Response.json({
					message: "Hello, world!",
					method: "GET",
					// Server-only key — validated at boot against the real environment.
					databaseConfigured: Boolean(env.DATABASE_URL),
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

	development: env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`🗄️  DATABASE_URL configured (${env.DATABASE_URL.length} chars)`);
