/* Hallmark · macrostructure: Workbench · F2 sticky-scroll knobs: pinned=left, content=terminal-walkthrough, steps=3
 * theme: custom · vibe: "nautical terminal, ocean-deep navy, marine-cyan accent" · paper: oklch(13% 0.014 225) · accent: oklch(78% 0.16 210)
 * display: JetBrains Mono · body: Geist · axes: dark / mono / cool
 * studied: no · context: explicit · v1.1.0
 */

"use client";

import { ExternalLink } from "@arkenv/fumadocs-ui/components";
import {
	Anchor,
	ArrowRight,
	Check,
	Compass,
	Copy,
	Cpu,
	FileCode,
	ExternalLink as LinkIcon,
	ShieldAlert,
	Terminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnnouncementBadge } from "~/components/announcement-badge";
import { CompatibilityRails } from "~/components/page/compatibility-rails";
import { VideoDemo } from "~/components/page/video-demo";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { useCopyCommand } from "~/hooks/use-copy-command";

export default function HomePage() {
	const initCommand = "npx arkenv init";
	const { copied, copy } = useCopyCommand(initCommand);
	const [activeTab, setActiveTab] = useState<"init" | "schema" | "fail">(
		"init",
	);

	return (
		<div className="flex flex-1 flex-col items-center justify-start relative w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary min-h-screen">
			{/* Nautical Radar/Sonar background visual - absolute positioned */}
			<div
				className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none opacity-20 dark:opacity-30 mix-blend-screen"
				aria-hidden="true"
			>
				<div className="absolute inset-0 rounded-full border border-primary/10 animate-[pulse_8s_infinite]" />
				<div className="absolute inset-16 rounded-full border border-primary/5" />
				<div className="absolute inset-32 rounded-full border border-primary/10" />
				<div className="absolute inset-48 rounded-full border border-primary/5" />
				{/* Sonar sweep line */}
				<div className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-linear-to-r from-primary to-transparent origin-left rotate-45 animate-[spin_12s_linear_infinite]" />
			</div>

			{/* N8 Styled Terminal Header */}
			<div className="w-full max-w-5xl mx-auto px-4 mt-8 md:mt-16 z-20">
				<div className="border border-border/80 rounded-lg bg-card/60 backdrop-blur-md px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono text-xs">
					<div className="flex items-center gap-3">
						<span className="text-primary font-bold animate-[pulse_2s_infinite]">
							⚓
						</span>
						<span className="text-muted-foreground">arkenv --version:</span>
						<span className="text-foreground">1.0.0</span>
					</div>
					<div className="flex flex-wrap items-center gap-4 text-muted-foreground">
						<Link
							href="/docs/arkenv"
							className="hover:text-primary transition-colors flex items-center gap-1"
						>
							<span>--docs</span>
						</Link>
						<span className="text-border/40">|</span>
						<a
							href="https://github.com/yamcodes/arkenv"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-primary transition-colors flex items-center gap-1"
						>
							<span>--github</span>
							<LinkIcon className="w-3 h-3" />
						</a>
						<span className="text-border/40">|</span>
						<span className="text-primary font-bold shrink-0">
							&gt; arkenv --init▮
						</span>
					</div>
				</div>
			</div>

			{/* Main Hero & Lede */}
			<main className="w-full max-w-5xl mx-auto px-4 mt-8 md:mt-12 z-20 flex flex-col items-center text-center">
				<div className="mb-4">
					<AnnouncementBadge href="/docs/nextjs" new>
						Official Next.js integration!
					</AnnouncementBadge>
				</div>

				<h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter max-w-3xl text-balance leading-tight mb-4 text-foreground">
					Foolproof environment variables.
				</h1>

				<p className="text-sm md:text-md text-muted-foreground max-w-xl text-balance mb-8 font-mono">
					CLI-first environment validator from editor to runtime. Power your
					project with sailing-smooth typesafety.
				</p>

				{/* Primary CTA CLI Command Chip */}
				<div className="w-full max-w-md mb-12">
					<button
						type="button"
						aria-label={copied ? "Copied" : "Copy init command"}
						onClick={copy}
						className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-card/80 border border-border rounded-lg group transition-all duration-200 hover:border-primary/50 hover:bg-card active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer font-mono"
					>
						<div className="flex items-center gap-3">
							<Terminal className="w-4 h-4 text-primary shrink-0" />
							<span className="text-sm text-foreground">$ {initCommand}</span>
						</div>
						<div className="border-l border-border pl-3 text-muted-foreground group-hover:text-primary transition-colors">
							{copied ? (
								<Check className="w-4 h-4 text-green-500" />
							) : (
								<Copy className="w-4 h-4" />
							)}
						</div>
					</button>
				</div>

				{/* Workbench Walkthrough Simulator */}
				<div className="w-full border border-border/80 rounded-xl bg-card/60 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden text-left mb-16">
					{/* Terminal window chrome */}
					<div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/80">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-red-500/80" />
							<div className="w-3 h-3 rounded-full bg-yellow-500/80" />
							<div className="w-3 h-3 rounded-full bg-green-500/80" />
						</div>
						<div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-md p-0.5">
							<button
								type="button"
								onClick={() => setActiveTab("init")}
								className={`px-3 py-1 text-[11px] font-mono rounded-sm transition-all cursor-pointer ${activeTab === "init" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
							>
								1. init
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("schema")}
								className={`px-3 py-1 text-[11px] font-mono rounded-sm transition-all cursor-pointer ${activeTab === "schema" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
							>
								2. schema (env.ts)
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("fail")}
								className={`px-3 py-1 text-[11px] font-mono rounded-sm transition-all cursor-pointer ${activeTab === "fail" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
							>
								3. validation
							</button>
						</div>
						<div className="w-14" />
					</div>

					{/* Workbench content frame */}
					<div className="p-5 font-mono text-xs md:text-sm min-h-[320px] overflow-auto leading-relaxed bg-background/30">
						{activeTab === "init" && (
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-muted-foreground">
									<Terminal className="w-4 h-4 text-primary" />
									<span>$ npx arkenv init</span>
								</div>
								<div className="space-y-1">
									<p className="text-primary font-semibold">
										⚓ Arkenv Bootstrapper v1.0.0
									</p>
									<p className="text-muted-foreground">
										Detecting project environment...
									</p>
								</div>
								<div className="space-y-1.5 border-l-2 border-primary/30 pl-3">
									<p className="text-foreground">
										? Framework detected:{" "}
										<span className="text-primary font-bold">
											Next.js (App Router)
										</span>
									</p>
									<p className="text-foreground">
										? Where should we place the config schema?{" "}
										<span className="text-muted-foreground font-semibold">
											./env.ts
										</span>
									</p>
									<p className="text-foreground">? Select target validator:</p>
									<p className="text-primary font-semibold">
										&nbsp;&nbsp;&gt; [x] ArkType (TypeScript's 1:1 validator)
									</p>
									<p className="text-muted-foreground">
										&nbsp;&nbsp;&nbsp;&nbsp;[ ] Zod
									</p>
									<p className="text-muted-foreground">
										&nbsp;&nbsp;&nbsp;&nbsp;[ ] Valibot
									</p>
								</div>
								<div className="space-y-1 text-muted-foreground">
									<p>
										Writing configuration template to{" "}
										<span className="text-foreground">./env.ts</span>...
									</p>
									<p>
										Configuring Next.js wrapper in{" "}
										<span className="text-foreground">./next.config.ts</span>...
									</p>
								</div>
								<div className="flex items-center gap-2 text-green-400 font-semibold pt-2">
									<span>⛵</span>
									<span>
										Successfully bootstrapped typesafe environment variables!
									</span>
								</div>
							</div>
						)}

						{activeTab === "schema" && (
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-muted-foreground border-b border-border pb-2">
									<FileCode className="w-4 h-4 text-primary" />
									<span>env.ts</span>
								</div>
								<pre className="text-foreground text-xs md:text-sm overflow-x-auto whitespace-pre leading-relaxed">
									{`import { createEnv } from "@arkenv/nextjs";

export const env = createEnv({
  // Schemas validated by ArkType
  NODE_ENV: "'development' | 'production' | 'test'",
  PORT: "number.port",
  HOST: "string.host",
  DATABASE_URL: "string.url",

  // Static inlined browser variables
  NEXT_PUBLIC_API_URL: "string.url",

  // Runtime mapping
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
});`}
								</pre>
							</div>
						)}

						{activeTab === "fail" && (
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-muted-foreground">
									<Terminal className="w-4 h-4 text-primary" />
									<span>$ npm run dev</span>
								</div>
								<div className="text-muted-foreground">
									<p>&gt; next dev</p>
									<p>Starting compilation server...</p>
								</div>
								<div className="p-3 border border-red-500/20 bg-red-950/10 rounded-md space-y-2">
									<div className="flex items-center gap-2 text-red-400 font-semibold">
										<ShieldAlert className="w-4 h-4" />
										<span>[arkenv] Validation failed:</span>
									</div>
									<ul className="list-disc list-inside pl-2 text-red-300 space-y-1">
										<li>
											PORT: Must be number.port (received{" "}
											<span className="underline">"not-a-port"</span>)
										</li>
										<li>
											DATABASE_URL: Must be string.url (received{" "}
											<span className="underline">undefined</span>)
										</li>
									</ul>
								</div>
								<div className="text-muted-foreground">
									<p>Please fix validation errors to continue.</p>
									<p className="text-red-400">Process exited with code 1.</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Secondary Action - Monospace Link */}
				<div className="mb-16">
					<Link
						href="/docs/arkenv"
						className="group font-mono text-sm text-primary hover:text-primary/80 inline-flex items-center gap-2"
					>
						<span>Explore the documentation</span>
						<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
					</Link>
				</div>

				{/* Video Demo Section */}
				<div className="w-full max-w-4xl border-t border-border/50 pt-16 mb-24">
					<div className="text-center mb-8">
						<h2 className="text-xl md:text-2xl font-semibold font-mono tracking-tight text-foreground">
							Interactive Demonstration
						</h2>
						<p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
							Watch how Arkenv secures your project config. Click window to open
							StackBlitz.
						</p>
					</div>
					<VideoDemo />
				</div>

				{/* Compatibility Rails */}
				<div className="w-full max-w-4xl border-t border-border/50 pt-16 mb-24">
					<div className="text-center mb-8">
						<h2 className="text-xl md:text-2xl font-semibold font-mono tracking-tight text-foreground">
							Nautical Rails Compatibility
						</h2>
						<p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
							ArkEnv integrates seamlessly across your developer pipeline.
						</p>
					</div>
					<CompatibilityRails />
				</div>

				{/* Technical Specs Grid */}
				<div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 text-left border-t border-border/50 pt-16">
					<div className="border border-border/80 rounded-lg p-5 bg-card/40 font-mono">
						<div className="flex items-center gap-3 text-primary mb-3">
							<Cpu className="w-5 h-5" />
							<h3 className="font-semibold text-sm">Lightweight</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Gzipped at less than 2kB with zero external dependencies. Pure
							speed and efficiency.
						</p>
					</div>
					<div className="border border-border/80 rounded-lg p-5 bg-card/40 font-mono">
						<div className="flex items-center gap-3 text-primary mb-3">
							<Compass className="w-5 h-5" />
							<h3 className="font-semibold text-sm">Cross-Platform</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Smooth sailing across Node.js, Bun, Next.js, Vite, and native
							browser environments.
						</p>
					</div>
					<div className="border border-border/80 rounded-lg p-5 bg-card/40 font-mono">
						<div className="flex items-center gap-3 text-primary mb-3">
							<Anchor className="w-5 h-5" />
							<h3 className="font-semibold text-sm">Strict Security</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Secures private server secrets from leaking to client-side bundles
							automatically.
						</p>
					</div>
				</div>
			</main>

			{/* Ft4 Dense Monospace Colophon Footer */}
			<footer className="w-full border-t border-border/80 bg-card/40 py-8 z-20 mt-auto font-mono text-[10px] md:text-xs">
				<div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex flex-col gap-1.5 text-left w-full md:w-auto">
						<div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
							<span>⚓ arkenv</span>
							<span className="text-[10px] font-normal text-muted-foreground">
								colophon
							</span>
						</div>
						<div className="text-muted-foreground leading-relaxed">
							Proud part of the{" "}
							<ExternalLink
								href="https://arktype.io/docs/ecosystem#arkenv"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground hover:text-primary transition-colors underline underline-offset-2"
							>
								ArkType ecosystem
							</ExternalLink>
							. Released under the MIT License.
						</div>
						<div className="text-muted-foreground">
							Copyright &copy; 2025-present Yam Borodetsky. All rights reserved.
						</div>
					</div>

					{/* Tucked away ThemeToggle */}
					<div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
						<span className="text-muted-foreground text-[10px] uppercase tracking-wider">
							Interface styling
						</span>
						<ThemeToggle className="bg-background/80 border-border" />
					</div>
				</div>
			</footer>
		</div>
	);
}
