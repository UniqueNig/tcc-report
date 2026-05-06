export type AppUserRole = "UNIT_HEAD" | "CORE_LEADER" | "ADMIN";

export const ROLE_HOME_PATHS: Record<AppUserRole, string> = {
  UNIT_HEAD: "/dashboard/unit-head",
  CORE_LEADER: "/dashboard/core-leader",
  ADMIN: "/dashboard/admin",
};

export function getRoleHomePath(role: AppUserRole): string {
  return ROLE_HOME_PATHS[role] ?? "/login";
}
