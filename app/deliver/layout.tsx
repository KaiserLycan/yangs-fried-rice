/**
 * Rider area.
 *
 * Literal prefix, same reasoning as /manage — "deliver" is in the URL so
 * middleware.ts guards the whole area with one /deliver/:path* match.
 *
 * Separate from /manage rather than a section inside it because the job is
 * genuinely different: riders work from a phone, in the field, one delivery
 * at a time. Same sign-in page as the rest of the employees, different
 * destination after it.
 *
 * TODO(auth): signed-in Employee with the Rider role, else redirect to
 * /employee/login.
 */
export default function DeliverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
