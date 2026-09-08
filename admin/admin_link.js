// ADMIN LINK - Secret route configuration
// This is the secret path only you know
// NOT visible in the public site navigation

export const ADMIN_SECRET_PATH = "/kawunlere-control-2024";
export const ADMIN_PASSWORD = "kawunlere2024";

// Middleware check function
export function isAdminPath(pathname) {
  return pathname === ADMIN_SECRET_PATH || pathname.startsWith(ADMIN_SECRET_PATH + "/");
}
