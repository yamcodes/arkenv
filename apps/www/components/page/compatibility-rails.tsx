import {
	SiBun,
	SiNodedotjs,
	SiSolid,
	SiVite,
	SiZod,
} from "@icons-pack/react-simple-icons";
import { Boxes, Hexagon, Layers, Shield, Zap } from "lucide-react";
import type { JSX } from "react";
import { ArkTypeIcon } from "../icons/arktype-icon";

type RailItem = {
	name: string;
	icon: (props: { className?: string }) => JSX.Element;
};

const validators: RailItem[] = [
	{
		name: "ArkType",
		icon: ({ className }) => (
			<ArkTypeIcon className={className} variant="monotone" />
		),
	},
	{ name: "Zod", icon: ({ className }) => <SiZod className={className} /> },
	{
		name: "Valibot",
		icon: ({ className }) => <Layers className={className} />,
	},
	{ name: "Typia", icon: ({ className }) => <Hexagon className={className} /> },
	{ name: "Yup", icon: ({ className }) => <Boxes className={className} /> },
	{ name: "Joi", icon: ({ className }) => <Shield className={className} /> },
];

const platforms: RailItem[] = [
	{
		name: "Node.js",
		icon: ({ className }) => <SiNodedotjs className={className} />,
	},
	{ name: "Bun", icon: ({ className }) => <SiBun className={className} /> },
	{ name: "Vite", icon: ({ className }) => <SiVite className={className} /> },
	{
		name: "Vinxi",
		icon: ({ className }) => (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src="https://vinxi.vercel.app/favicon.ico"
				className={className}
				alt=""
				onError={(e) => {
					e.currentTarget.style.display = "none";
					e.currentTarget.nextElementSibling?.classList.remove("hidden");
				}}
			/>
		),
	},
	{
		name: "SolidStart",
		icon: ({ className }) => <SiSolid className={className} />,
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
	const RailIcon = reverse ? "animate-marquee-reverse" : "animate-marquee";

	return (
		<div className="flex items-center gap-4 w-full group/rail">
			<span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap min-w-[80px]">
				{label}
			</span>
			<div className="relative flex overflow-hidden flex-1 select-none mask-[linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
				<div
					className={`flex shrink-0 items-center justify-around gap-12 min-w-full ${RailIcon} animation-duration-[3600s]`}
				>
					{[...items, ...items, ...items].map((item, i) => (
						<div
							key={`${item.name}-${i}`}
							className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/5 dark:bg-gray-400/5 border border-gray-500/10 dark:border-400/10 text-xs text-gray-500 dark:text-gray-400 transition-colors"
						>
							<item.icon className="w-3.5 h-3.5 opacity-70 group-hover/rail:opacity-100 transition-opacity" />
							<span className="font-medium tracking-tight opacity-80 group-hover/rail:opacity-100 transition-opacity">
								{item.name}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function CompatibilityRails() {
	return (
		<div className="flex flex-col gap-3 w-full max-w-md mx-auto lg:mx-0 py-6 pause-on-hover px-1 overflow-hidden">
			<MarqueeRow label="Works with" items={validators} />
			<MarqueeRow label="Built for" items={platforms} reverse />
		</div>
	);
}
