import type { Metadata } from "next";
import { HomePageClient } from "./home-page-client";

export const metadata: Metadata = {
	title: "ArkEnv",
	description: "Environment variable validation from editor to runtime",
};

export default function HomePage() {
	return <HomePageClient />;
}
