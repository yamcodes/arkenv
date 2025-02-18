import type { Metadata } from "next";
import { CopyButton } from "~/components/page/copy-button";
import { Logo } from "~/components/page/logo";
import { SailButton } from "~/components/page/sail-button";
import { StackBlitzDemo } from "~/components/page/stackblitz-demo";
import { Bricolage_Grotesque } from "next/font/google";

const bricolageGrotesque = Bricolage_Grotesque({
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "ark.env: Typesafe Environment Variables",
	description:
		"ark.env is a tool for managing environment variables in your project.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<h1 className={`mb-4 ${bricolageGrotesque.className} mt-16`}>
				<div className="text-5xl font-extrabold">
					Your environment variables, but 100% typesafe.
				</div>
				<div className="text-xl mt-4 text-gray-600 dark:text-gray-400">
					Bring the power of ArkType to your environment variables <br /> and
					ship confidently.
				</div>
			</h1>
			<div className="flex justify-center my-4 gap-4 sm:mb-6 mb-16">
				<SailButton />
			</div>
			<div className="mt-12 px-4 sm:px-8 max-w-5xl mx-auto w-full">
				<h2 className="text-xl font-semibold mb-4">
					...or try it out below 👇
				</h2>
				<StackBlitzDemo />
			</div>
		</main>
	);
}
