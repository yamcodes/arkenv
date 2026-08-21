"use client";

import {
	SiBun,
	SiClaude,
	SiCloudflare,
	SiCursor,
	SiJetbrains,
	SiNetlify,
	SiNextdotjs,
	SiNodedotjs,
	SiNuxt,
	SiTypescript,
	SiVercel,
	SiVite,
	SiZod,
} from "@icons-pack/react-simple-icons";
import type { JSX } from "react";
import { ArkTypeIcon } from "~/components/icons/arktype-icon";
import { SolidStartIcon } from "~/components/icons/solid-start-icon";
import { TypiaIcon } from "~/components/icons/typia-icon";
import { ValibotIcon } from "~/components/icons/valibot-icon";
import { VsCodeIcon } from "~/components/icons/vscode-icon";

type LogoItem = {
	name: string;
	icon: (props: { className?: string }) => JSX.Element;
};

/**
 * Ecosystem logos for the full-width ticker.
 * Compatibility list — not a map of the hero tabs. Tabs preview ArkType / Zod;
 * this list includes those plus Valibot, Typia, runtimes, editors, and hosts.
 */
const worksWith: LogoItem[] = [
	{
		name: "ArkType",
		icon: ({ className }) => (
			<ArkTypeIcon className={className} variant="monotone" />
		),
	},
	{
		name: "Zod",
		icon: ({ className }) => <SiZod className={className} />,
	},
	{
		name: "Valibot",
		icon: ({ className }) => <ValibotIcon className={className} />,
	},
	{
		name: "Typia",
		icon: ({ className }) => <TypiaIcon className={className} />,
	},
	{
		name: "TypeScript",
		icon: ({ className }) => <SiTypescript className={className} />,
	},
	{
		name: "Vite",
		icon: ({ className }) => <SiVite className={className} />,
	},
	{
		name: "Next.js",
		icon: ({ className }) => <SiNextdotjs className={className} />,
	},
	{
		name: "Nuxt",
		icon: ({ className }) => <SiNuxt className={className} />,
	},
	{
		name: "SolidStart",
		icon: ({ className }) => <SolidStartIcon className={className} />,
	},
	{
		name: "Vercel",
		icon: ({ className }) => <SiVercel className={className} />,
	},
	{
		name: "Cloudflare",
		icon: ({ className }) => <SiCloudflare className={className} />,
	},
	{
		name: "Netlify",
		icon: ({ className }) => <SiNetlify className={className} />,
	},
	{
		name: "Node.js",
		icon: ({ className }) => <SiNodedotjs className={className} />,
	},
	{
		name: "Bun",
		icon: ({ className }) => <SiBun className={className} />,
	},
	{
		name: "JetBrains",
		icon: ({ className }) => <SiJetbrains className={className} />,
	},
	{
		name: "VS Code",
		icon: ({ className }) => <VsCodeIcon className={className} />,
	},
	{
		name: "Cursor",
		icon: ({ className }) => <SiCursor className={className} />,
	},
	{
		name: "Claude Code",
		icon: ({ className }) => <SiClaude className={className} />,
	},
];

function LogoTile({ item }: { item: LogoItem }) {
	return (
		<span className="home-aurora__works-logo">
			<span className="home-aurora__works-logo-mark" aria-hidden="true">
				<item.icon className="home-aurora__works-logo-icon" />
			</span>
			<span className="home-aurora__works-logo-name">{item.name}</span>
		</span>
	);
}

/**
 * “Works with your stack” ticker — ecosystem half of the hero trust bar.
 */
export function WorksWith() {
	return (
		<section className="home-aurora__works" aria-label="Works with your stack">
			<span className="home-aurora__works-label">Works with</span>
			<div className="home-aurora__works-marquee pause-on-hover">
				<div
					className="home-aurora__works-track animate-marquee"
					style={{ ["--marquee-duration" as string]: "60s" }}
				>
					<div className="home-aurora__works-set">
						{worksWith.map((item) => (
							<LogoTile key={item.name} item={item} />
						))}
					</div>
					<div className="home-aurora__works-set" aria-hidden="true">
						{worksWith.map((item) => (
							<LogoTile key={item.name} item={item} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
