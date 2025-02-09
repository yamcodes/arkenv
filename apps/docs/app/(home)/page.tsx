import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
	title: "ark.env: Typesafe Environment Variables",
	description:
		"ark.env is a tool for managing environment variables in your project.",
};

export default function HomePage() {
	return (
		<main className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 text-2xl font-bold">
				<code className="text-fd-foreground">ark.env</code>
			</h1>
			<p className="text-fd-muted-foreground">Typesafe Environment Variables</p>
			<div className="flex justify-center mt-4">
				<Button asChild>
					<Link href="/docs">Set sail --&gt;</Link>
				</Button>
			</div>
		</main>
	);
}
