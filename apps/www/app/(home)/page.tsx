import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { SailButton, StarUsButton, TypeScriptSandbox } from "~/components/page";

const bricolageGrotesque = Bricolage_Grotesque({
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "ArkEnv: Typesafe environment variables powered by ArkType",
	description:
		"ArkEnv is a tool for managing environment variables in your project.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center px-4 sm:px-0">
			<h1 className={`mb-4 ${bricolageGrotesque.className} mt-16`}>
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
					to your environment variables <br /> and ship with confidence.
				</div>
			</h1>
			<div className="flex flex-col sm:flex-row justify-center my-4 gap-4 sm:mb-6 mb-16">
				<SailButton />
				<StarUsButton />
			</div>
			<div className="mt-6 sm:mt-12 sm:px-8 max-w-5xl mx-auto w-full">
				<h2 className="text-xl font-semibold mb-4">See ArkEnv in action 👇</h2>
				<TypeScriptSandbox />
			</div>
		</main>
	);
}
