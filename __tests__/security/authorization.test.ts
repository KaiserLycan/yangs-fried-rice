import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  canAccessManagePath,
  canChangeRole,
  canDisableEmployee,
  canResetEmployeePassword,
  homePathForRole,
  resolveEmployeeRole,
  type EmployeeRole,
} from "@/lib/auth/roles";
import { canReleaseDelivery } from "@/lib/orders/delivery-assignment";

/**
 * Authorization — Phase 4 section D.
 *
 * Three layers have to agree, and each is checked here:
 *   1. middleware.ts — which pages a role may open.
 *   2. The API routes under /api, which middleware deliberately skips.
 *   3. The server actions, which re-check the caller before touching data.
 */

const ROLES: (EmployeeRole | null)[] = ["MANAGER", "STAFF", "RIDER", null];

describe("D1. page access by role", () => {
  const MANAGER_ONLY = [
    "/manage/dashboard",
    "/manage/reports",
    "/manage/customers",
    "/manage/employee",
  ];
  const SHARED = ["/manage/orders", "/manage/menu", "/manage/kds", "/manage/profile"];

  it.each(MANAGER_ONLY)("only a manager may open %s", (path) => {
    expect(canAccessManagePath("MANAGER", path)).toBe(true);
    expect(canAccessManagePath("STAFF", path)).toBe(false);
    expect(canAccessManagePath("RIDER", path)).toBe(false);
    expect(canAccessManagePath(null, path)).toBe(false);
  });

  it.each(SHARED)("a manager and staff may open %s, a rider may not", (path) => {
    expect(canAccessManagePath("MANAGER", path)).toBe(true);
    expect(canAccessManagePath("STAFF", path)).toBe(true);
    expect(canAccessManagePath("RIDER", path)).toBe(false);
    expect(canAccessManagePath(null, path)).toBe(false);
  });

  it("is not fooled by a path that merely starts with an allowed one", () => {
    expect(canAccessManagePath("STAFF", "/manage/orders-secret")).toBe(false);
    expect(canAccessManagePath("STAFF", "/manage/menufoo")).toBe(false);
  });

  it("sends each role somewhere it is allowed to be", () => {
    for (const role of ROLES) {
      const home = homePathForRole(role as EmployeeRole);
      if (home.startsWith("/manage")) {
        expect(canAccessManagePath(role, home)).toBe(true);
      }
    }
  });

  it("reads the stored role whatever its casing, so access is not lost", () => {
    for (const stored of ["MANAGER", "Manager", "manager", " manager "]) {
      expect(canAccessManagePath(resolveEmployeeRole(stored), "/manage/reports")).toBe(true);
    }
    // A legacy title still resolves, and only to staff-level access.
    expect(canAccessManagePath(resolveEmployeeRole("Cashier"), "/manage/orders")).toBe(true);
    expect(canAccessManagePath(resolveEmployeeRole("Cashier"), "/manage/reports")).toBe(false);
  });
});

describe("D2. management actions by role", () => {
  it("only a manager may change roles", () => {
    expect(canChangeRole("MANAGER", "STAFF", "RIDER")).toBe(true);
    expect(canChangeRole("STAFF", "RIDER", "MANAGER")).toBe(false);
    expect(canChangeRole("RIDER", "RIDER", "MANAGER")).toBe(false);
  });

  it("nobody may disable their own account", () => {
    expect(canDisableEmployee("MANAGER", "MANAGER", true)).toBe(false);
  });

  it("a manager may not disable another manager", () => {
    expect(canDisableEmployee("MANAGER", "MANAGER", false)).toBe(false);
    expect(canDisableEmployee("MANAGER", "STAFF", false)).toBe(true);
    expect(canDisableEmployee("MANAGER", "RIDER", false)).toBe(true);
  });

  it("staff and riders may not disable anyone", () => {
    expect(canDisableEmployee("STAFF", "RIDER", false)).toBe(false);
    expect(canDisableEmployee("RIDER", "STAFF", false)).toBe(false);
  });

  it("anyone may change their own password; only a manager may change another's", () => {
    expect(canResetEmployeePassword("RIDER", "RIDER", true)).toBe(true);
    expect(canResetEmployeePassword("STAFF", "RIDER", false)).toBe(false);
    expect(canResetEmployeePassword("MANAGER", "STAFF", false)).toBe(true);
    expect(canResetEmployeePassword("MANAGER", "MANAGER", false)).toBe(false);
  });
});

describe("D3. a rider may only act on their own delivery", () => {
  it("cannot hand back a delivery belonging to another rider", () => {
    expect(canReleaseDelivery({ assignedRiderId: "rider-2", status: "delivering" }, "rider-1")).toBe(false);
  });

  it("can hand back their own", () => {
    expect(canReleaseDelivery({ assignedRiderId: "rider-1", status: "delivering" }, "rider-1")).toBe(true);
  });
});

/**
 * D4. Every route under /api is either deliberately public or guarded.
 *
 * `middleware.ts` excludes /api from its matcher, so a handler with no check
 * of its own is reachable by anyone. This walks the router files and asserts
 * each exported handler either calls a guard or is on the public list.
 */
describe("D4. no API route is left unguarded", () => {
  const PUBLIC_HANDLERS = new Set([
    // The menu is public — a signed-out visitor browses it before logging in.
    "getCategories",
    "getCategoryById",
    "getProducts",
    "getProductById",
    "getProductAddons",
    "getAddonById",
    // Address checking is a lookup used by the sign-up form, before any account exists.
    "validateAddress",
    // Sign-in and sign-out must be reachable without being signed in.
    "customerLogin",
    "employeeLogin",
    "employeeLogout",
  ]);

  const ROUTERS = [
    "categories",
    "products",
    "addons",
    "transactions",
    "deliveries",
    "riders",
    "admin",
    "notifications",
    "address",
    "auth",
    "orders",
    "profile",
    "employee-profile",
    "reports",
  ];

  const GUARD_CALLS =
    /(requireApiEmployee|requireRole|requireManageAccess|requireCustomer|requireEmployee|requireReportAccess|auth\.getUser|getCurrentEmployee)/;

  it.each(ROUTERS)("%s router guards every handler that is not public", (name) => {
    const source = readFileSync(`app/api/routers/${name}.ts`, "utf8");

    // Split the file into one chunk per exported handler.
    const parts = source.split(/export async function /).slice(1);
    expect(parts.length).toBeGreaterThan(0);

    const unguarded = parts
      .map((part) => ({
        name: part.slice(0, part.indexOf("(")).trim(),
        body: part,
      }))
      .filter(({ name: handler, body }) => {
        if (PUBLIC_HANDLERS.has(handler)) return false;
        // A handler may guard itself, or delegate to a server action that does.
        const delegates = /Action\(|from "@\/lib\/actions/.test(body);
        return !GUARD_CALLS.test(body) && !delegates;
      })
      .map(({ name: handler }) => handler);

    expect(unguarded).toEqual([]);
  });

  it("the mutating menu routes really do require an employee", () => {
    for (const file of ["categories", "products", "addons"]) {
      const source = readFileSync(`app/api/routers/${file}.ts`, "utf8");
      for (const verb of ["create", "update", "delete"]) {
        const handler = source.split(new RegExp(`export async function ${verb}\\w*`))[1] ?? "";
        expect(handler).toMatch(/requireApiEmployee\("MANAGER", "STAFF"\)/);
      }
    }
  });

  it("rider administration is manager-only", () => {
    const source = readFileSync("app/api/routers/riders.ts", "utf8");
    for (const verb of ["createRider", "updateRider", "deleteRider"]) {
      const handler = source.split(verb)[1] ?? "";
      expect(handler).toMatch(/requireApiEmployee\("MANAGER"\)/);
    }
  });
});

/**
 * D5. A public endpoint must not read a table the `anon` role cannot see.
 *
 * Migration 20260921000004 revoked anon's SELECT on customer, customer_address,
 * employee, rider, reports and notification. A public route that embeds one of
 * them fails outright for a signed-out visitor — and would have been exposing
 * that data to them before the revoke.
 */
describe("D5. public routes read only publicly readable tables", () => {
  const ANON_CANNOT_READ = [
    "customer",
    "customer_address",
    "employee",
    "rider",
    "reports",
    "notification",
  ];

  const PUBLIC_HANDLERS = [
    { file: "products.ts", handlers: ["getProducts", "getProductById"] },
    { file: "categories.ts", handlers: ["getCategories", "getCategoryById"] },
    { file: "addons.ts", handlers: ["getProductAddons", "getAddonById"] },
  ];

  it.each(PUBLIC_HANDLERS)("$file public reads touch no restricted table", ({ file, handlers }) => {
    const source = readFileSync(`app/api/routers/${file}`, "utf8");

    for (const handler of handlers) {
      const start = source.indexOf(`export async function ${handler}`);
      expect(start).toBeGreaterThan(-1);

      const next = source.indexOf("export async function ", start + 1);
      // Comments are stripped first: a note *explaining* why an embed was
      // removed mentions the table by name, and should not count as using it.
      const body = source
        .slice(start, next === -1 ? undefined : next)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");

      // Both the table being queried and any embedded relation.
      for (const table of ANON_CANNOT_READ) {
        expect(body).not.toMatch(new RegExp(`\\.from\\(["'\`]${table}["'\`]`));
        expect(body).not.toMatch(new RegExp(`\\b${table}\\s*\\(`));
      }
    }
  });
});
