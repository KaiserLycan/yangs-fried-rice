import { notFound } from "next/navigation";

/**
 * Swagger UI for `public/openapi.json`. Useful while developing; in
 * production it is a map of every endpoint for anyone who asks (security
 * review S12), so it 404s there. `middleware.ts` does the same for the
 * JSON file.
 */
export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
