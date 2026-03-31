/**
 * Frontend permissions map – mirrors backend/src/config/permissions.js
 *
 * Used by AuthContext helpers and sidebar filtering.
 */

export const PERMISSIONS = {
  // General
  VIEW_DASHBOARD: "view_dashboard",
  SEARCH_CATALOG: "search_catalog",
  VIEW_BOOK_DETAIL: "view_book_detail",
  VIEW_OWN_HISTORY: "view_own_history",

  // Circulation
  CHECKOUT_BOOK: "checkout_book",
  RETURN_BOOK: "return_book",
  VIEW_OVERDUE: "view_overdue",

  // Management
  MANAGE_CATALOG: "manage_catalog",
  MANAGE_USERS: "manage_users",

  // Analytics
  VIEW_REPORTS: "view_reports",
  VIEW_AUDIT_LOGS: "view_audit_logs",

  // Settings
  MANAGE_SETTINGS: "manage_settings",
};

export const ROLE_PERMISSIONS = {
  student: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.SEARCH_CATALOG,
    PERMISSIONS.VIEW_BOOK_DETAIL,
    PERMISSIONS.VIEW_OWN_HISTORY,
  ],
  teacher: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.SEARCH_CATALOG,
    PERMISSIONS.VIEW_BOOK_DETAIL,
    PERMISSIONS.VIEW_OWN_HISTORY,
  ],
  librarian: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.SEARCH_CATALOG,
    PERMISSIONS.VIEW_BOOK_DETAIL,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.CHECKOUT_BOOK,
    PERMISSIONS.RETURN_BOOK,
    PERMISSIONS.VIEW_OVERDUE,
    PERMISSIONS.MANAGE_CATALOG,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.SEARCH_CATALOG,
    PERMISSIONS.VIEW_BOOK_DETAIL,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.CHECKOUT_BOOK,
    PERMISSIONS.RETURN_BOOK,
    PERMISSIONS.VIEW_OVERDUE,
    PERMISSIONS.MANAGE_CATALOG,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
};

/**
 * Map each frontend route to the permission required to access it.
 */
export const ROUTE_PERMISSIONS = {
  "/dashboard": PERMISSIONS.VIEW_DASHBOARD,
  "/search": PERMISSIONS.SEARCH_CATALOG,
  "/history": PERMISSIONS.VIEW_OWN_HISTORY,
  "/checkout": PERMISSIONS.CHECKOUT_BOOK,
  "/return": PERMISSIONS.RETURN_BOOK,
  "/overdue": PERMISSIONS.VIEW_OVERDUE,
  "/catalog": PERMISSIONS.MANAGE_CATALOG,
  "/users": PERMISSIONS.MANAGE_USERS,
  "/reports": PERMISSIONS.VIEW_REPORTS,
  "/audit-logs": PERMISSIONS.VIEW_AUDIT_LOGS,
  "/settings": PERMISSIONS.MANAGE_SETTINGS,
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}
