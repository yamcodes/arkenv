/**
 * Empty shared schema used when `#arkenv/shared-schema` is imported outside
 * strict layout, or in strict layout when `env/internal/shared.ts` is omitted
 * (so the client entry can keep a static import without Vite failing to
 * resolve the virtual specifier).
 */
export const SharedSchema = {};
