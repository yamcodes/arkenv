import { type FormEvent, useState } from "react";

export function EnvDisplay() {
	const [envVars, setEnvVars] = useState<
		Array<{ key: string; value: string; type: string }>
	>([]);

	const checkEnvVariable = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const form = e.currentTarget;
		const formData = new FormData(form);
		const varName = (formData.get("varName") as string).toUpperCase();

		if (!varName.trim()) return;

		// Access the environment variable dynamically
		// In Bun, env vars are injected at build time as string replacements
		const value = (globalThis as Record<string, unknown>)[varName];

		// Check if already exists in list
		const exists = envVars.some((v) => v.key === varName);

		if (exists) {
			// Update existing
			setEnvVars(
				envVars.map((v) =>
					v.key === varName
						? {
								key: varName,
								value: String(value ?? "undefined"),
								type: typeof value,
							}
						: v,
				),
			);
		} else {
			// Add new
			setEnvVars([
				...envVars,
				{
					key: varName,
					value: String(value ?? "undefined"),
					type: typeof value,
				},
			]);
		}

		// Clear input
		form.reset();
	};

	const removeVar = (key: string) => {
		setEnvVars(envVars.filter((v) => v.key !== key));
	};

	return (
		<div className="env-display">
			<h2 className="env-title">Environment Variables</h2>

			<form onSubmit={checkEnvVariable} className="env-input-form">
				<input
					type="text"
					name="varName"
					placeholder="BUN_PUBLIC_API_URL"
					className="env-input"
					autoComplete="off"
				/>
				<button type="submit" className="env-check-button">
					Check
				</button>
			</form>

			{envVars.length === 0 ? (
				<div className="env-empty">
					<p>No environment variables checked yet.</p>
					<p className="env-hint">
						Enter a variable name above to check its value and type.
					</p>
				</div>
			) : (
				<div className="env-list">
					{envVars.map(({ key, value, type }) => (
						<div key={key} className="env-item">
							<div className="env-item-header">
								<span className="env-key">{key}</span>
								<div className="env-header-right">
									<span className="env-type">{type}</span>
									<button
										type="button"
										onClick={() => removeVar(key)}
										className="env-remove-button"
										aria-label={`Remove ${key}`}
									>
										×
									</button>
								</div>
							</div>
							<div className="env-value">{value}</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
