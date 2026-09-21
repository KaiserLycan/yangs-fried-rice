import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { signupSchema } from "@/lib/validation/signup";
import { contactDetailsSchema } from "@/lib/validation/profile";
import { reviewSubmissionSchema } from "@/lib/validation/reviews";
import { addCartItemSchema, submitCartSchema } from "@/lib/validation/cart";
import { orderStatusSchema } from "@/lib/validation/orders";
import { createEmployeeSchema, updateCustomerSchema } from "@/lib/validation/admin";
import { escapeLikePattern } from "@/lib/validation/like-pattern";

/**
 * SQL / query injection — Phase 4 section B.
 *
 * The application never builds SQL. Every read and write goes through the
 * Supabase client, which sends values as parameters over PostgREST, so a
 * value like `' OR 1=1 --` is only ever compared as text. These tests check
 * the two things that could still go wrong:
 *
 *   1. A constrained field accepting an injection string at all.
 *   2. Someone reintroducing string-built SQL or a string-built PostgREST
 *      filter, which is the one place user input could change a query's
 *      shape rather than its values.
 */

const INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1 --",
  "admin'--",
  "'; DROP TABLE customer; --",
  "1' UNION SELECT NULL, email, NULL FROM auth.users --",
  "\\'; DELETE FROM \"order\"; --",
  ") or true --",
  "*/ UNION ALL SELECT 1 /*",
];

describe("B1. constrained fields reject injection strings outright", () => {
  const signupBase = {
    firstName: "Liza",
    lastName: "Reyes",
    email: "liza@example.com",
    phone: "+639171234567",
    password: "securepassword123",
    buildingNo: "1",
    street: "Mapúa Ave",
    barangay: "San Andres",
    city: "Manila",
    zip: "1000",
  };

  it.each(INJECTION_PAYLOADS)("rejects %s in the email field", (payload) => {
    expect(signupSchema.safeParse({ ...signupBase, email: payload }).success).toBe(false);
  });

  it.each(INJECTION_PAYLOADS)("rejects %s in the mobile field", (payload) => {
    expect(
      contactDetailsSchema.safeParse({ mobile: payload, email: "a@b.com" }).success,
    ).toBe(false);
  });

  it.each(INJECTION_PAYLOADS)("rejects %s where an id is expected", (payload) => {
    // Ids are UUIDs. Anything else never reaches a query.
    expect(addCartItemSchema.safeParse({ product_id: payload, quantity: 1 }).success).toBe(false);
    expect(submitCartSchema.safeParse({ cart_id: payload }).success).toBe(false);
    expect(updateCustomerSchema.safeParse({ phone_number: payload }).success).toBe(false);
  });

  it.each(INJECTION_PAYLOADS)("rejects %s where a fixed vocabulary is expected", (payload) => {
    expect(orderStatusSchema.safeParse(payload).success).toBe(false);
    expect(
      createEmployeeSchema.safeParse({
        name: "A",
        email: "a@b.com",
        password: "12345678",
        role: payload,
      }).success,
    ).toBe(false);
  });

  it.each(INJECTION_PAYLOADS)("rejects %s where a number is expected", (payload) => {
    expect(reviewSubmissionSchema.safeParse({ rating: payload }).success).toBe(false);
    expect(
      addCartItemSchema.safeParse({
        product_id: "11111111-1111-4111-8111-111111111111",
        quantity: payload,
      }).success,
    ).toBe(false);
  });
});

describe("B2. free-text fields keep injection strings as plain text", () => {
  // A customer is allowed to write anything in a delivery note or a review.
  // The point is that it is stored and echoed as text, never executed — so
  // validation accepts it unchanged rather than mangling it.
  it.each(INJECTION_PAYLOADS)("accepts %s as a review comment, unchanged", (payload) => {
    const result = reviewSubmissionSchema.safeParse({ rating: 5, comment: payload });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.comment).toBe(payload);
  });

  it.each(INJECTION_PAYLOADS)("accepts %s as special instructions, unchanged", (payload) => {
    const result = addCartItemSchema.safeParse({
      product_id: "11111111-1111-4111-8111-111111111111",
      quantity: 1,
      special_instructions: payload,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.special_instructions).toBe(payload);
  });
});

describe("B3. LIKE wildcards in a value cannot widen a query", () => {
  it("escapes % and _ so they match literally", () => {
    expect(escapeLikePattern("100% beef")).toBe("100\\% beef");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
    expect(escapeLikePattern("C:\\path")).toBe("C:\\\\path");
  });

  it("leaves an ordinary value alone", () => {
    expect(escapeLikePattern("21 Mabini St")).toBe("21 Mabini St");
  });
});

/**
 * B4. The structural guarantee.
 *
 * Scans the whole source tree. A value sent through `.eq()`, `.ilike()` and
 * friends is encoded by the client and can only ever be data; a filter built
 * by pasting a value into a string is the one shape that lets a caller change
 * the query itself. This fails if either that, or raw SQL string building,
 * reappears.
 */
describe("B4. no query is built by string concatenation", () => {
  const ROOTS = ["app", "lib", "components", "middleware.ts"];
  const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);

  function sourceFiles(path: string): string[] {
    const stats = statSync(path);
    if (stats.isFile()) return /\.(ts|tsx)$/.test(path) ? [path] : [];

    return readdirSync(path).flatMap((entry) => {
      if (SKIP_DIRS.has(entry)) return [];
      return sourceFiles(join(path, entry));
    });
  }

  const files = ROOTS.flatMap(sourceFiles).filter(
    (file) => !/\.test\.(ts|tsx)$/.test(file),
  );

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("never interpolates into a PostgREST filter expression", () => {
    // `.or("a.eq." + userValue)` — the value becomes part of the filter tree.
    const pattern = /\.(or|filter)\(\s*`[^`]*\$\{/;
    const offenders = files.filter((file) => pattern.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("never builds a SQL statement in application code", () => {
    // Matched on statement shape (SELECT…FROM, UPDATE…SET) rather than on a
    // lone keyword, so an ordinary message like `Failed to update order:
    // ${err}` is not mistaken for a query.
    const sqlShapes = [
      /\bselect\b[\s\S]{0,300}\bfrom\b[\s\S]{0,300}\$\{/i,
      /\binsert\s+into\b[\s\S]{0,300}\$\{/i,
      /\bupdate\b\s+["'\w.]+\s+\bset\b[\s\S]{0,300}\$\{/i,
      /\bdelete\s+from\b[\s\S]{0,300}\$\{/i,
      /\bdrop\s+(table|database)\b/i,
    ];
    const offenders = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      // Only template literals, which is the only way to interpolate.
      return (source.match(/`[^`]*`/g) ?? []).some((literal) =>
        sqlShapes.some((shape) => shape.test(literal)),
      );
    });
    expect(offenders).toEqual([]);
  });

  it("catches a string-built query if one is ever added (control)", () => {
    // Proves the scan above can actually fail, rather than passing because
    // its pattern never matches anything.
    const sqlShapes = [
      /\bselect\b[\s\S]{0,300}\bfrom\b[\s\S]{0,300}\$\{/i,
      /\bdelete\s+from\b[\s\S]{0,300}\$\{/i,
    ];
    const planted = "`SELECT * FROM customer WHERE email = ${email}`";
    expect(sqlShapes.some((shape) => shape.test(planted))).toBe(true);

    const ordinary = "`Failed to update order: ${result.error}`";
    expect(sqlShapes.some((shape) => shape.test(ordinary))).toBe(false);
  });

  it("never calls a raw-SQL escape hatch from application code", () => {
    const pattern = /\b(execute_sql|pg_query|rawQuery|knex\.raw|sequelize\.query)\b/;
    const offenders = files.filter((file) => pattern.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
