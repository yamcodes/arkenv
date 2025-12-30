"use client";

import {
	SiBun,
	SiNodedotjs,
	SiVite,
	SiZod,
} from "@icons-pack/react-simple-icons";
import { Square } from "lucide-react";
import type { JSX } from "react";
import { cn } from "~/lib/utils";
import { ArkTypeIcon } from "../icons/arktype-icon";
import { JoiIcon } from "../icons/joi-icon";
import { SolidStartIcon } from "../icons/solid-start-icon";
import { TypiaIcon } from "../icons/typia-icon";
import { ValibotIcon } from "../icons/valibot-icon";
import { VinxiIcon } from "../icons/vinxi-icon";

type RailItem = {
	name: string;
	icon: (props: { className?: string }) => JSX.Element;
	url: string;
};

const validators: RailItem[] = [
	{
		name: "ArkType",
		url: "https://arktype.io",
		icon: ({ className }) => (
			<ArkTypeIcon className={className} variant="monotone" />
		),
	},
	{
		name: "Zod",
		url: "https://zod.dev",
		icon: ({ className }) => <SiZod className={className} />,
	},
	{
		name: "Valibot",
		url: "https://valibot.dev",
		icon: ({ className }) => <ValibotIcon className={className} />,
	},
	{
		name: "Typia",
		url: "https://typia.io",
		icon: ({ className }) => <TypiaIcon className={className} />,
	},
	{
		name: "Yup",
		url: "https://github.com/jquense/yup",
		icon: ({ className }) => <Square className={className} />,
	},
	{
		name: "Joi",
		url: "https://joi.dev",
		icon: ({ className }) => <JoiIcon className={className} />,
	},
];

const platforms: RailItem[] = [
	{
		name: "Node.js",
		url: "https://nodejs.org",
		icon: ({ className }) => <SiNodedotjs className={className} />,
	},
	{
		name: "Bun",
		url: "https://bun.sh",
		icon: ({ className }) => <SiBun className={className} />,
	},
	{
		name: "Vite",
		url: "https://vite.dev",
		icon: ({ className }) => <SiVite className={className} />,
	},
	{
		name: "Vinxi",
		url: "https://vinxi.vercel.app",
		icon: ({ className }) => <VinxiIcon className={className} />,
	},
	{
		name: "SolidStart",
		url: "https://start.solidjs.com",
		icon: ({ className }) => <SolidStartIcon className={className} />,
	},
];

function MarqueeRow({
	items,
	reverse = false,
	label,
}: {
	items: RailItem[];
	reverse?: boolean;
	label: string;
}) {
	const animationClass = reverse
		? "animate-marquee-reverse"
		: "animate-marquee";

	return (
		<div className="flex items-center gap-4 w-full group/rail">
			<span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 whitespace-nowrap w-[85px] text-left">
				{label}
			</span>
			<div className="relative flex overflow-hidden flex-1 select-none mask-[linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
				<div
					className={`flex shrink-0 items-center justify-around gap-6 min-w-full ${animationClass}`}
					style={{ "--marquee-duration": "75s" } as React.CSSProperties}
				>
					{[...items, ...items, ...items].map((item, i) => (
						<a
							key={`${item.name}-${i}`}
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/5 dark:bg-gray-400/5 border border-gray-500/10 dark:border-gray-400/10 text-xs text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-500/10 dark:hover:bg-gray-400/10 hover:border-gray-500/20 dark:hover:border-gray-400/20 hover:text-gray-600 dark:hover:text-gray-300 pointer-events-auto"
						>
							<item.icon className="w-3.5 h-3.5 opacity-70 group-hover/rail:opacity-100 transition-opacity" />
							<span className="font-medium tracking-tight opacity-80 group-hover/rail:opacity-100 transition-opacity">
								{item.name}
							</span>
						</a>
					))}
				</div>
			</div>
		</div>
	);
}

export function CompatibilityRails({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 w-full max-w-lg mx-auto lg:mx-0 py-2 md:py-6 pause-on-hover px-1 overflow-hidden",
				className,
			)}
		>
			<MarqueeRow label="Works with" items={validators} />
			<MarqueeRow label="Built for" items={platforms} reverse />
		</div>
	);
}
