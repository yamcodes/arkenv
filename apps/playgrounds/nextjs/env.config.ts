export const server = {
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
} as const;

export const client = {
	NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
} as const;

export const shared = {
	NODE_ENV: "string = 'development'",
} as const;
