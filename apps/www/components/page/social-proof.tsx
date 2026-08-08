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
import Image from "next/image";
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
 * Soft-clustered 6×3 reading order (no section labels):
 * schemas & build → frameworks & hosts → runtimes & IDEs/agents.
 */
const designedFor: LogoItem[] = [
	// Row 1 — schemas & build
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
	// Row 2 — frameworks & hosts
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
	// Row 3 — runtimes & IDEs/agents
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

/**
 * Hero social proof — Colin quote + Designed for logo boxes.
 */
export function SocialProof() {
	return (
		<section className="home-aurora__proof" aria-label="Social proof">
			<figure className="home-aurora__proof-quote">
				<Image
					src="/assets/colin-mcdonnell.png"
					alt=""
					width={96}
					height={96}
					className="home-aurora__proof-avatar"
				/>
				<div className="home-aurora__proof-quote-body">
					<blockquote>
						<p>&ldquo;Cool project btw! 👍&rdquo;</p>
					</blockquote>
					<figcaption>
						<span className="home-aurora__proof-name">Colin McDonnell</span>
						<span className="home-aurora__proof-role">Creator of Zod</span>
					</figcaption>
				</div>
			</figure>

			<div className="home-aurora__proof-logos">
				<span className="home-aurora__proof-logos-label">Works with</span>
				<ul className="home-aurora__proof-logos-list">
					{designedFor.map((item) => (
						<li key={item.name}>
							<span className="home-aurora__proof-logo">
								<item.icon className="home-aurora__proof-logo-icon" />
								<span className="home-aurora__proof-logo-name">{item.name}</span>
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
