import type { Metadata } from "next";
import Image from "next/image";
import { AnnouncementBadge } from "~/components/announcement-badge";
import { HeroGradientOverlay } from "~/components/hero-gradient-overlay";
import { HeroVisual } from "~/components/hero-visual";
import {
	CompatibilityRails,
	QuickstartButton,
	StarUsButton,
	VideoDemo,
} from "~/components/page";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "Environment variable validation from editor to runtime",
};

export default function HomePage() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center relative w-full overflow-hidden">
			{/* Top gradient overlay for dark mode - SVG version */}
			<HeroGradientOverlay />

			<div className="flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:pl-12 lg:pr-6 max-w-screen-2xl mx-auto w-full gap-8 lg:gap-12 lg:mt-20">
				<div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:flex-[1.4] relative z-20 mt-12 w-full max-w-full">
					<div className="lg:mb-6 mb-0">
						<AnnouncementBadge new href="/docs/arkenv/coercion">
							Automatic type coercion
						</AnnouncementBadge>
					</div>
					<h1 className="mb-4 mt-6 lg:mt-0 w-full max-w-2xl">
						<div className="text-5xl md:text-6xl font-semibold tracking-tighter lg:whitespace-nowrap">
							Better{" "}
							<span className="bg-linear-to-br from-blue-500 via-blue-600 to-indigo-700 bg-clip-text text-transparent inline-block pr-1 -mr-1">
								typesafe
							</span>{" "}
							than sorry
						</div>
						<div className="text-xl md:text-2xl mt-4 text-gray-600 dark:text-gray-400">
							Environment variable validation from editor to runtime
						</div>
					</h1>
					<CompatibilityRails />
					<div className="flex flex-col sm:flex-row justify-center lg:justify-start my-4 gap-4 sm:mb-6 mb-16 w-full sm:w-auto sm:max-w-none">
						<QuickstartButton />
						<StarUsButton />
					</div>
				</div>
				<div className="hidden md:flex lg:flex-1 w-full justify-center lg:justify-end relative z-0">
					<HeroVisual />
				</div>
			</div>

			<div className="sm:mt-8 max-w-5xl mx-auto w-full relative z-20 px-4">
				<VideoDemo />
			</div>

			{/* Homepage Footer with Fade Gradient and Stylized Separator */}
			<div className="w-full relative mt-32">
				{/* Background fade gradient */}
				<div className="absolute inset-0 bg-linear-to-b from-transparent to-gray-200/90 dark:to-black/80 -z-10" />

				{/* Stylized Divider: ----------(space)(icon)(space)---------- */}
				<div className="flex items-center w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
					<div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-500/10 to-gray-500/30 dark:via-blue-500/10 dark:to-blue-500/30" />
					<div className="px-6 flex items-center justify-center">
						<div className="relative group">
							<Image
								src="/assets/icon.svg"
								alt=""
								aria-hidden="true"
								width={22}
								height={22}
								className="opacity-80 grayscale brightness-0 dark:brightness-0 dark:invert group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-100 group-hover:dark:invert-0 transition-all duration-500"
							/>
							<div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
						</div>
					</div>
					<div className="h-px flex-1 bg-linear-to-l from-transparent via-gray-500/10 to-gray-500/30 dark:via-blue-500/10 dark:to-blue-500/30" />
				</div>

				<footer className="relative z-20">
					<div className="max-w-screen-2xl mx-auto py-14 px-4 sm:px-6 lg:px-12 flex flex-col items-center text-center gap-4">
						<div className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
							Proud part of the{" "}
							<a
								href="https://arktype.io/docs/ecosystem#arkenv"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
							>
								ArkType ecosystem
							</a>
						</div>
						<div className="flex flex-col gap-1.5 items-center text-gray-500 dark:text-gray-500 text-sm">
							<div>Released under the MIT License</div>
							<div>Copyright © 2025 Yam Borodetsky</div>
						</div>
					</div>
				</footer>
			</div>
		</div>
	);
}
