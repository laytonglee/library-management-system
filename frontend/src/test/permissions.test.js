import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS, ROLE_PERMISSIONS } from "@/constants/permissions";

describe("hasPermission", () => {
  it("returns true for a permission the role has", () => {
    expect(hasPermission("admin", PERMISSIONS.MANAGE_DATA)).toBe(true);
    expect(hasPermission("admin", PERMISSIONS.MANAGE_USERS)).toBe(true);
    expect(hasPermission("librarian", PERMISSIONS.CHECKOUT_BOOK)).toBe(true);
    expect(hasPermission("student", PERMISSIONS.VIEW_DASHBOARD)).toBe(true);
  });

  it("returns false for a permission the role lacks", () => {
    expect(hasPermission("student", PERMISSIONS.MANAGE_USERS)).toBe(false);
    expect(hasPermission("student", PERMISSIONS.MANAGE_DATA)).toBe(false);
    expect(hasPermission("librarian", PERMISSIONS.MANAGE_DATA)).toBe(false);
    expect(hasPermission("teacher", PERMISSIONS.CHECKOUT_BOOK)).toBe(false);
  });

  it("returns false for an unknown role", () => {
    expect(hasPermission("ghost", PERMISSIONS.VIEW_DASHBOARD)).toBe(false);
    expect(hasPermission(null, PERMISSIONS.VIEW_DASHBOARD)).toBe(false);
    expect(hasPermission(undefined, PERMISSIONS.VIEW_DASHBOARD)).toBe(false);
  });

  it("admin has all defined permissions", () => {
    const allPerms = Object.values(PERMISSIONS);
    const adminPerms = ROLE_PERMISSIONS.admin;
    for (const perm of allPerms) {
      expect(adminPerms).toContain(perm);
    }
  });

  it("student and teacher cannot manage library operations", () => {
    const restricted = [
      PERMISSIONS.CHECKOUT_BOOK,
      PERMISSIONS.RETURN_BOOK,
      PERMISSIONS.MANAGE_CATALOG,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_DATA,
      PERMISSIONS.MANAGE_SETTINGS,
    ];
    for (const role of ["student", "teacher"]) {
      for (const perm of restricted) {
        expect(hasPermission(role, perm)).toBe(false);
      }
    }
  });
});
