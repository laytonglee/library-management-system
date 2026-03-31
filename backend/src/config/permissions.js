/**
 * Role-based permissions map for the Library Management System.
 *
 * Roles: student, teacher, librarian, admin
 *
 * Each permission is a string key. Roles are mapped to the permissions
 * they are allowed to perform.
 */

const PERMISSIONS = {
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

const ROLE_PERMISSIONS = {
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
 * Check if a role has a specific permission
 */
function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

/**
 * Get all permissions for a role
 */
function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissionsForRole,
};
