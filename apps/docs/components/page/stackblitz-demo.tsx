"use client";

import { useEffect, useRef } from "react";
import sdk from "@stackblitz/sdk";

const PROJECT_FILES = {
	"package.json": `{
		"name": "ark-env-basic-example",
		"private": true,
		"type": "module",
		"scripts": {
			"start": "tsx index.ts",
			"dev": "tsx watch index.ts"
		},
		"dependencies": {
			"ark.env": "latest",
			"arktype": "latest",
			"picocolors": "^1.1.1",
			"tsx": "^4.7.0"
		},
		"devDependencies": {
			"typescript": "^5.3.3",
			"@types/node": "^20.11.0"
		}
	}`,
	"index.ts": `import ark, { host, port } from "ark.env";
import { blue, bold, green, red } from "picocolors";

// Define our environment configuration
const env = ark.env({
	HOST: host.default("localhost"),
	PORT: port.default("3000"),
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Pretty print the configuration
console.log(
	\`🚀 Server running at \${bold(blue(env.HOST))}:\${bold(green(env.PORT))} in \${bold(
		env.NODE_ENV === "production" ? red(env.NODE_ENV) : blue(env.NODE_ENV),
	)} mode\`,
);

// This is just an example - in a real app you would use these values
// to configure your server or application
export default env;`,
	".env": `HOST=localhost
PORT=3000
NODE_ENV=development`,
	"tsconfig.json": `{
		"compilerOptions": {
			"module": "ESNext",
			"target": "ESNext",
			"moduleResolution": "bundler",
			"strict": true,
			"skipLibCheck": true,
			"isolatedModules": true
		}
	}`,
	".stackblitzrc": `{
		"startCommand": "npm install"
	}`,
};

export function StackBlitzDemo() {
	const embedRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (embedRef.current) {
			sdk.embedProject(
				embedRef.current,
				{
					title: "ark.env Basic Example",
					description:
						"A basic example of using ark.env for typesafe environment variables",
					template: "node",
					files: PROJECT_FILES,
				},
				{
					openFile: "index.ts",
					view: "editor",
					height: 600,
					hideExplorer: false,
					terminalHeight: 80,
					forceEmbedLayout: true,
					theme: "dark",
					showSidebar: true,
				},
			);
		}
	}, []);

	return (
		<div className="w-full rounded-lg overflow-hidden border border-fd-border shadow-lg min-h-[600px] relative">
			<div className="absolute inset-0" ref={embedRef} />
		</div>
	);
}
