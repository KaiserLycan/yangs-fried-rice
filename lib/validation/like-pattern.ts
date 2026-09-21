/**
 * Escapes the wildcards in a value used inside a LIKE/ILIKE pattern.
 *
 * `%` and `_` are wildcards in SQL pattern matching, so a value containing
 * them silently widens the match — a duplicate-address check for "Unit 5%"
 * would match every address starting with "Unit 5". Escaping is not a
 * protection against injection (values are always sent as parameters, never
 * pasted into SQL); it is about the query meaning what it says.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}
