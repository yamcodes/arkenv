import { HomeLayout } from "fumadocs-ui/layouts/home";
import Link from "next/link";
import { baseOptions } from "~/app/layout.config";

export default function NotFound() {
	return (
		<HomeLayout
			{...baseOptions}
			links={[
				{
					text: "Documentation",
					url: "/docs/arkenv",
					active: "none",
				},
			]}
		>
			<div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
				<p className="text-sm font-semibold text-blue-500 dark:text-blue-400">
					404
				</p>
				<h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
					Page not found
				</h1>
				<p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400 max-w-md">
					Sorry, we couldn’t find the page you’re looking for. It might have
					been moved to a new location or renamed.
				</p>
				<div className="mt-10 flex flex-col items-start w-fit mx-auto text-left">
					<ul className="flex flex-col gap-y-1 text-base text-muted-foreground list-disc">
						<li>
							<Link href="/" className="underline hover:text-foreground">
								Home
							</Link>
						</li>
						<li>
							<Link
								href="/docs/arkenv"
								className="underline hover:text-foreground"
							>
								Documentation
							</Link>
						</li>
						<li>
							<a
								href="https://github.com/yamcodes/arkenv"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground"
							>
								GitHub
							</a>
						</li>
						<li>
							<a
								href="https://discord.gg/zAmUyuxXH9"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground"
							>
								Discord
							</a>
						</li>
					</ul>
				</div>
			</div>
		</HomeLayout>
	);
}
