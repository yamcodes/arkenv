import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { HeroVideo } from "~/components/hero-video";
import { SailButton, StarUsButton, VideoDemo } from "~/components/page";

const bricolageGrotesque = Bricolage_Grotesque({
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "Typesafe environment variables powered by ArkType ⛵️",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col items-center justify-center relative w-full overflow-hidden">
			{/* Top gradient overlay for dark mode - SVG version */}
			<svg
				viewBox="0 0 1440 181"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="pointer-events-none absolute w-full top-0 left-0 h-[160px] z-10 opacity-100 text-blue-50 dark:text-[#011537]"
				preserveAspectRatio="none"
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

			<div className="flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full gap-8 lg:gap-16 lg:mt-20">
				<div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1 relative z-20 lg:mt-12">
					<h1 className={`mb-4 ${bricolageGrotesque.className} mt-16 lg:mt-0`}>
						<div className="text-6xl font-extrabold">
							Better{" "}
							<span className="decoration-[rgb(180,215,255)] decoration-wavy decoration-1 underline underline-offset-4">
								typesafe
							</span>{" "}
							than sorry
						</div>
						<div className="text-2xl mt-4 text-gray-600 dark:text-gray-400">
							Bring the power of{" "}
							<a
								href="https://arktype.io"
								target="_blank"
								rel="noopener noreferrer"
								className="underline underline-offset-6 decoration-[1.5px] transition-underline duration-200 hover:decoration-[3px] focus:decoration-[3px] active:text-blue-400"
							>
								ArkType
							</a>{" "}
							to your environment variables and ship with confidence.
						</div>
					</h1>
					<div className="flex flex-col sm:flex-row justify-center lg:justify-start my-4 gap-4 sm:mb-6 mb-16 w-full sm:w-auto">
						<SailButton />
						<StarUsButton />
					</div>
				</div>
				<div className="hidden md:flex flex-1 w-full justify-center lg:justify-end">
					<HeroVideo />
				</div>
			</div>

			<div className="sm:mt-8 max-w-[1024px] mx-auto w-full relative z-20 px-4">
				<VideoDemo />
			</div>
		</main>
	);
}
