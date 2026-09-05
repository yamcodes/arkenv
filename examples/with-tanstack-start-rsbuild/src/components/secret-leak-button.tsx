import { useState } from "react";
import { env } from "~/env";

function LeakedSecret() {
	// Accessing server-only DATABASE_URL directly in client render tree throws an error
	return <p>Server key leaked: {env.DATABASE_URL}</p>;
}

export function SecretLeakButton() {
	const [attempted, setAttempted] = useState(false);

	if (attempted) {
		return <LeakedSecret />;
	}

	return (
		<button type="button" onClick={() => setAttempted(true)}>
			Try reading DATABASE_URL on the client
		</button>
	);
}
