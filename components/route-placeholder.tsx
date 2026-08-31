/**
 * Placeholder body for scaffolded-but-unbuilt routes.
 *
 * Every page in this scaffold renders one of these. The point is that the
 * route tree, the URLs, and the layout/auth seams are real and reviewable
 * while the pages themselves have no behaviour yet — nothing here can be
 * wrong, because nothing here does anything.
 *
 * Delete the import as each page gets built for real.
 */
export function RoutePlaceholder({
  title,
  description,
  requirements,
}: {
  title: string;
  description: string;
  /** Requirement IDs from docs/reference/yangs_fried_rice_context.md */
  requirements?: string[];
}) {
  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-prose">{description}</p>
      {requirements?.length ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Requirements: {requirements.join(", ")}
        </p>
      ) : null}
      <p className="text-muted-foreground mt-6 text-xs">
        Placeholder — not implemented.
      </p>
    </main>
  );
}
