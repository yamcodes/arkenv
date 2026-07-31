import { WindowChrome } from "./window-chrome";
import { highlightTs } from "./highlight-ts";

const CLIENT = `export const env = arkenv({
  NEXT_PUBLIC_API_URL: "string",
});`;

const SERVER = `export const env = arkenv({
  DATABASE_URL: "string",
});`;

/**
 * Client / server env boundary pitch.
 * Examples mirror /docs/nextjs/layouts/strict.
 */
export async function SecureBoundary() {
	const [clientHtml, serverHtml] = await Promise.all([
		highlightTs(CLIENT),
		highlightTs(SERVER),
	]);

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-secure"
			id="secure"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					03 - SECURE
				</p>
				<h2 id="home-secure" data-reveal="blur">
					Keep secrets off the client.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					ArkEnv isolates frontend and backend variables. You keep private keys
					out of the browser bundle.
				</p>
			</header>

			<div
				className="home-aurora__secure"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<figure className="home-aurora__secure-pane" data-side="client">
					<WindowChrome title="env/client.ts" />
					<p className="home-aurora__secure-badge">Browser</p>
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server */}
					<div
						className="home-aurora__shiki"
						dangerouslySetInnerHTML={{ __html: clientHtml }}
					/>
				</figure>

				<figure className="home-aurora__secure-pane" data-side="server">
					<WindowChrome title="env/server.ts" />
					<p className="home-aurora__secure-badge">Server only</p>
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server */}
					<div
						className="home-aurora__shiki"
						dangerouslySetInnerHTML={{ __html: serverHtml }}
					/>
				</figure>
			</div>
		</section>
	);
}
