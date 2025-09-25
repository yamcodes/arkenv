import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EnvDisplay() {
	// Get the MY_VALUE environment variable
	// In Bun, client-side env vars need to be prefixed with BUN_PUBLIC_
	const myValue = process.env.BUN_PUBLIC_MY_VALUE || "Not set";

	return (
		<Card className="bg-card/50 backdrop-blur-sm border-muted">
			<CardHeader>
				<CardTitle className="text-xl">Environment Variables</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="font-mono text-sm text-muted-foreground">
							MY_VALUE:
						</span>
						<span className="font-mono text-sm bg-muted px-2 py-1 rounded">
							{myValue}
						</span>
					</div>
					<p className="text-sm text-muted-foreground">
						This value is loaded from your environment variables.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
