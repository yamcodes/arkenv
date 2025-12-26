import type { Metadata } from "next";
import { HeroVisual } from "~/components/hero-visual";
import { ArkTypeIcon } from "~/components/icons/arktype-icon";
import { QuickstartButton, StarUsButton, VideoDemo } from "~/components/page";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "Typesafe environment variables powered by ArkType ⛵️",
};

export default function HomePage() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center relative w-full overflow-hidden">
			{/* Top gradient overlay for dark mode - SVG version */}
			<svg
				viewBox="0 0 1440 181"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="pointer-events-none absolute w-full top-0 left-0 h-40 z-10 opacity-100 text-blue-50 dark:text-[#011537]"
				preserveAspectRatio="none"
				aria-hidden="true"
				role="presentation"
				focusable="false"
			>
				<mask id="path-1-inside-1" fill="white">
					<path d="M0 0H1440V181H0V0Z" />
				</mask>
				<path
					d="M0 0H1440V181H0V0Z"
					fill="url(#paint0_linear)"
					fillOpacity="1"
				/>
				<path
					d="M0 2H1440V-2H0V2Z"
					fill="url(#paint1_linear)"
					mask="url(#path-1-inside-1)"
				/>
				<defs>
					<linearGradient
						id="paint0_linear"
						x1="720"
						y1="0"
						x2="720"
						y2="181"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="currentColor" />
						<stop offset="1" stopColor="currentColor" stopOpacity="0" />
					</linearGradient>
					<linearGradient
						id="paint1_linear"
						x1="0"
						y1="90.5"
						x2="1440"
						y2="90.5"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#60a5fa" stopOpacity="0" />
						<stop offset="0.5" stopColor="#60a5fa" />
						<stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
					</linearGradient>
				</defs>
			</svg>

			<div className="flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:pl-12 lg:pr-6 max-w-screen-2xl mx-auto w-full gap-8 lg:gap-20 lg:mt-20">
				<div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1 relative z-20 lg:mt-12">
					<h1 className="mb-4 mt-16 lg:mt-0">
						<div className="text-6xl font-semibold tracking-tighter lg:whitespace-nowrap">
							Better{" "}
							<span className="bg-linear-to-br from-blue-500 via-blue-600 to-indigo-700 bg-clip-text text-transparent inline-block pr-1 -mr-1">
								typesafe
							</span>{" "}
							than sorry
						</div>
						<div className="text-2xl mt-4 text-gray-600 dark:text-gray-400">
							Typesafe environment variables from editor to runtime
						</div>
					</h1>
					<div className="flex items-center gap-2 mb-8">
						<a
							href="https://arktype.io"
							target="_blank"
							rel="noopener noreferrer"
							className="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/10 dark:border-blue-400/10 text-sm font-medium transition-all hover:bg-blue-500/10 dark:hover:bg-blue-400/10 hover:border-blue-500/20 dark:hover:border-blue-400/20 hover:scale-[1.02] active:scale-[0.98]"
						>
							<ArkTypeIcon className="rounded-md shadow-sm" />
							<span className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100">
								<span className="text-blue-900/70 dark:text-blue-100/70 font-normal">
									Powered by
								</span>
								<span className="text-blue-600 dark:text-blue-400 font-bold">
									ArkType
								</span>
							</span>
						</a>
					</div>
					<div className="flex flex-col sm:flex-row justify-center lg:justify-start my-4 gap-4 sm:mb-6 mb-16 w-full sm:w-auto">
						<QuickstartButton />
						<StarUsButton />
					</div>
				</div>
				<div className="hidden md:flex flex-1 w-full justify-center lg:justify-end">
					<HeroVisual />
				</div>
			</div>

			<div className="sm:mt-8 max-w-5xl mx-auto w-full relative z-20 px-4">
				<VideoDemo />
			</div>
		</div>
	);
}
