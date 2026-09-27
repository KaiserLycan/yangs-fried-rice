import { readFileSync } from "node:fs";

/**
 * The database as the migrations build it, for the static schema tests.
 *
 * `supabase/migrations/` is a baseline dumped from the live project plus a
 * platform file (storage, auth triggers, cron), so the tests check the end
 * state rather than the history that produced it. pg_dump quotes every
 * identifier; the quotes are dropped here so a test can say
 * `ON public.order_item` instead of `ON "public"."order_item"`. Comments are
 * dropped too, so an explanation that mentions a statement doesn't count as
 * the statement.
 */
const read = (file: string) => readFileSync(`supabase/migrations/${file}`, "utf8");

const normalise = (sql: string) =>
  sql
    .replace(/\r\n/g, "\n")
    .replace(/--.*$/gm, "")
    .replace(/"([a-z_][a-z0-9_]*)"/g, "$1");

export const BASELINE = normalise(read("20260929100000_baseline.sql"));
export const PLATFORM = normalise(read("20260929100001_platform_setup.sql"));
export const SCHEMA = `${BASELINE}\n${PLATFORM}`;

/** Every `CREATE [OR REPLACE] FUNCTION public.<name>(` definition, body included. */
export function functionSql(name: string): string {
  const start = new RegExp(`CREATE (?:OR REPLACE )?FUNCTION public\\.${name}\\(`, "g");
  const bodies: string[] = [];
  for (const match of SCHEMA.matchAll(start)) {
    const from = match.index!;
    const tag = SCHEMA.slice(from).match(/AS (\$[a-z_]*\$)/);
    if (!tag) continue;
    const bodyStart = SCHEMA.indexOf(tag[1], from) + tag[1].length;
    const bodyEnd = SCHEMA.indexOf(tag[1], bodyStart);
    bodies.push(SCHEMA.slice(from, bodyEnd + tag[1].length));
  }
  if (bodies.length === 0) throw new Error(`No function public.${name} in the migrations`);
  return bodies.join("\n");
}

/** The CREATE POLICY statements on a table (`public.order`, `storage.objects`). */
export function policiesOn(table: string): string[] {
  const escaped = table.replace(".", "\\.");
  return SCHEMA.match(new RegExp(`CREATE POLICY [^;]*? ON ${escaped} [^;]*;`, "g")) ?? [];
}

/** The body of `CREATE TABLE public.<name> (...)`. */
export function tableSql(name: string): string {
  const match = SCHEMA.match(new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${name} \\(([\\s\\S]*?)\\n\\);`));
  if (!match) throw new Error(`No table public.${name} in the migrations`);
  return match[1];
}
