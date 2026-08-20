/**
 * Simulated IDE autocomplete + Terminal fail-fast runtime output side-by-side.
 */
import { WindowChrome } from "./window-chrome";

export function TypeSafetyShowcase() {
	return (
		<section className="home-aurora__pitch" aria-labelledby="home-dx" id="dx">
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					02 / TYPESAFE
				</p>
				<h2 id="home-dx" data-reveal="blur">
					Editor autocomplete with fail-fast at runtime.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Your editor gets perfect types. ArkEnv rejects missing or invalid keys
					at build or startup, before they reach production.
				</p>
			</header>

			<div
				className="home-aurora__typesafe-split"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				{/* Left Window: IDE Autocomplete */}
				<figure
					className="home-aurora__ide"
					role="img"
					aria-label="IDE showing env autocomplete"
				>
					<WindowChrome title="./app.ts" />
					<pre className="home-aurora__ide-body">
						<code>
							<span className="home-aurora__tok-kw">import</span>
							{" { "}
							<span className="home-aurora__tok-id">env</span>
							{" } "}
							<span className="home-aurora__tok-kw">from</span>
							<span className="home-aurora__tok-str">{` "./env"`}</span>
							{";\n\n"}
							<span className="home-aurora__tok-kw">const</span>
							{" db = "}
							<span className="home-aurora__tok-id">env</span>
							<span className="home-aurora__tok-punct">.</span>
							<span className="home-aurora__tok-caret" aria-hidden="true" />
						</code>
					</pre>
					<ul className="home-aurora__ide-menu" aria-hidden="true">
						<li data-active="true">
							<span className="home-aurora__ide-name">DATABASE_URL</span>
							<span className="home-aurora__ide-type">string</span>
						</li>
						<li>
							<span className="home-aurora__ide-name">PORT</span>
							<span className="home-aurora__ide-type">number</span>
						</li>
						<li>
							<span className="home-aurora__ide-name">NODE_ENV</span>
							<span className="home-aurora__ide-type">
								&quot;development&quot; | &quot;production&quot;
							</span>
						</li>
					</ul>
				</figure>

				{/* Right Window: Terminal Fail-Fast Runtime Output */}
				<figure
					className="home-aurora__terminal h-full flex flex-col"
					data-side="error"
				>
					<WindowChrome title="node server.js" />
					<div className="p-4 font-mono text-xs space-y-3 bg-red-950/20 text-rose-200 flex-1">
						<div className="flex items-center gap-2 border-b border-rose-900/40 pb-2.5">
							<span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase">
								Runtime Error
							</span>
							<span className="text-[11px] text-zinc-500 font-mono">
								Process Exited (1)
							</span>
						</div>
						<div className="font-semibold text-rose-100 text-xs sm:text-sm">
							ArkEnvError: Errors found while validating environment variables
						</div>
						<div className="text-zinc-300 text-xs leading-relaxed space-y-1.5 pl-2 border-l-2 border-rose-500/40">
							<div>
								<span className="text-amber-300 font-semibold">
									DATABASE_URL
								</span>{" "}
								must be a valid URL starting with postgresql:// or mysql:// (was
								&quot;localhost/db&quot;)
							</div>
							<div>
								<span className="text-amber-300 font-semibold">PORT</span> must
								be an integer between 0 and 65535 (was &quot;8080a&quot;)
							</div>
						</div>
					</div>
				</figure>
			</div>
		</section>
	);
}
