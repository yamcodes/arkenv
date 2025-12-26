import type { Metadata } from "next";
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
	description: "Typesafe environment variables powered by ArkType ⛵️",
};

export default function HomePage() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center relative w-full overflow-hidden">
			{/* Top gradient overlay for dark mode - SVG version */}
			<HeroGradientOverlay />

			<div className="flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:pl-12 lg:pr-6 max-w-screen-2xl mx-auto w-full gap-8 lg:gap-12 lg:mt-20">
				<div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:flex-[1.4] relative z-20 lg:mt-12 w-full max-w-full">
					<h1 className="mb-4 mt-16 lg:mt-0 w-full max-w-2xl">
						<div className="text-4xl sm:text-6xl font-semibold tracking-tighter lg:whitespace-nowrap">
							Better{" "}
							<span className="bg-linear-to-br from-blue-500 via-blue-600 to-indigo-700 bg-clip-text text-transparent inline-block pr-1 -mr-1">
								typesafe
							</span>{" "}
							than sorry
						</div>
						<div className="text-lg sm:text-2xl mt-4 text-gray-600 dark:text-gray-400">
							Typesafe environment variables from editor to runtime
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
		</div>
	);
}
