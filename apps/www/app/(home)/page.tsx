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
			{/* Top gradient overlay for dark mode */}
			<div className="absolute top-0 left-0 right-0 h-[500px] bg-linear-to-b from-[#071b3c] to-transparent pointer-events-none dark:opacity-80 opacity-0 z-10" />
			
			<div className="flex flex-col lg:flex-row items-center justify-center px-4 sm:px-0 max-w-7xl mx-auto w-full gap-8 lg:gap-16">
				<div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1 relative z-20">
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
					<div className="flex flex-col sm:flex-row justify-center lg:justify-start my-4 gap-4 sm:mb-6 mb-16">
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
