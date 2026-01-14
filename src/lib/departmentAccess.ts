// Department-based module access control
// This defines which modules each department can access

export interface ModuleAccess {
  id: string;
  title: string;
  path: string;
}

const normalizeDepartment = (department: string | null): string | null => {
  if (!department) return null;
  return department.trim();
};

const normalizeModuleId = (moduleId: string): string => moduleId.trim().toLowerCase();

// Define allowed modules per department
// Note: 'attendance' and 'hr' are available to ALL users
export const DEPARTMENT_MODULES: Record<string, string[]> = {
  "Marketing": ["content", "tasks", "crm", "attendance", "hr"],
  "Accounting": ["accounting", "sales", "commission-management", "attendance", "hr"],
  "Finance": ["accounting", "sales", "commission-management", "attendance", "hr"],
  "Sales": ["sales", "attendance", "hr"],
  "Operations": ["tasks", "attendance", "crm", "hr"],
  "HR": ["hr", "tasks", "attendance"],
};

// All available modules in the system
export const ALL_MODULES: ModuleAccess[] = [
  { id: "sales", title: "Sales Management", path: "/sales" },
  { id: "crm", title: "B&B CRM", path: "/crm" },
  { id: "tasks", title: "Task Manager", path: "/tasks" },
  { id: "accounting", title: "Accounting", path: "/accounting" },
  { id: "content", title: "Content Production", path: "/content" },
  { id: "attendance", title: "Attendance", path: "/attendance" },
  { id: "commission-management", title: "Commission Management", path: "/commission-management" },
  { id: "hr", title: "HR Management", path: "/hr" },
];

// User-specific module overrides (by user_id)
// These users get access to additional modules beyond their department defaults
export const USER_MODULE_OVERRIDES: Record<string, string[]> = {
  // Sara Memon - Full access: Sales, HR, CRM, Attendance, Tasks
  "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0": ["hr", "crm", "attendance", "tasks", "sales"],
};

// Get allowed modules for a department
// If isCeoCoo is true, return all modules
// Also merges user-specific overrides if userId is provided
export const getAllowedModules = (
  department: string | null,
  isCeoCoo: boolean = false,
  userId?: string
): ModuleAccess[] => {
  if (isCeoCoo) return ALL_MODULES;

  const normalizedDepartment = normalizeDepartment(department);
  if (!normalizedDepartment) return [];

  const departmentModuleIds = DEPARTMENT_MODULES[normalizedDepartment] || [];
  const userOverrides = userId ? USER_MODULE_OVERRIDES[userId] || [] : [];

  // Combine department modules with user-specific overrides (no duplicates)
  const allowedModuleIds = [...new Set([...departmentModuleIds, ...userOverrides])].map(normalizeModuleId);

  return ALL_MODULES.filter((module) => allowedModuleIds.includes(normalizeModuleId(module.id)));
};

// Check if a department can access a specific module
// Also checks user-specific overrides if userId is provided
export const canAccessModule = (
  department: string | null,
  moduleId: string,
  userId?: string
): boolean => {
  const normalizedDepartment = normalizeDepartment(department);
  if (!normalizedDepartment) return false;

  const normalizedModuleId = normalizeModuleId(moduleId);

  const departmentModuleIds = (DEPARTMENT_MODULES[normalizedDepartment] || []).map(normalizeModuleId);
  const userOverrides = (userId ? USER_MODULE_OVERRIDES[userId] || [] : []).map(normalizeModuleId);

  return departmentModuleIds.includes(normalizedModuleId) || userOverrides.includes(normalizedModuleId);
};

// Get the default route for a department (first allowed module)
export const getDefaultRoute = (department: string | null, userId?: string): string => {
  const allowedModules = getAllowedModules(department, false, userId);
  return allowedModules.length > 0 ? allowedModules[0].path : "/user-dashboard";
};
