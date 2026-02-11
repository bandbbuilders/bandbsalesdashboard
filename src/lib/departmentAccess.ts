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
export const DEPARTMENT_MODULE_MAP: Record<string, string[]> = {
  "marketing": ["content", "social", "tasks", "crm", "attendance", "hr", "inventory"],
  "accounting": ["accounting", "sales", "commission-management", "attendance", "hr", "social"],
  "finance": ["accounting", "sales", "commission-management", "attendance", "hr", "social"],
  "sales": ["sales", "attendance", "hr", "inventory", "social"],
  "operations": ["tasks", "attendance", "crm", "hr", "social"],
  "hr": ["hr", "tasks", "attendance", "social"],
  "management": ["sales", "crm", "tasks", "accounting", "content", "attendance", "commission-management", "hr", "inventory", "social"],
  "ceo/coo": ["sales", "crm", "tasks", "accounting", "content", "attendance", "commission-management", "hr", "inventory", "social"],
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
  { id: "inventory", title: "Inventory", path: "/sales/inventory" },
  { id: "social", title: "Social Media", path: "/social" },
];

// User-specific module overrides (by user_id)
// These users get access to additional modules beyond their department defaults
export const USER_MODULE_OVERRIDES: Record<string, string[]> = {
  // Sara Memon - Full access
  "2bdf88c3-56d0-4eff-8fb1-243fa17cc0f0": ["hr", "crm", "attendance", "tasks", "sales", "social", "inventory"],
  // Zia Shahid - Manager Access + Tasks
  "e91f0415-009a-4712-97e1-c70d1c29e6f9": ["sales", "tasks", "crm", "attendance", "hr"],
  // Zain Sarwar - Full access
  "fab190bd-3c71-43e8-9381-3ec66044e501": ["hr", "crm", "attendance", "tasks", "sales", "social", "inventory"],
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

  const normalizedDeptName = department ? department.trim().toLowerCase() : "";
  const departmentModuleIds = DEPARTMENT_MODULE_MAP[normalizedDeptName] || ["attendance", "hr", "tasks", "social"];
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
  const normalizedDeptName = department ? department.trim().toLowerCase() : "";
  const normalizedModuleId = normalizeModuleId(moduleId);

  const departmentModuleIds = (DEPARTMENT_MODULE_MAP[normalizedDeptName] || ["attendance", "hr", "tasks", "social"]).map(normalizeModuleId);
  const userOverrides = (userId ? USER_MODULE_OVERRIDES[userId] || [] : []).map(normalizeModuleId);

  return departmentModuleIds.includes(normalizedModuleId) || userOverrides.includes(normalizedModuleId);
};

// Get the default route for a department (first allowed module)
export const getDefaultRoute = (department: string | null, userId?: string): string => {
  const allowedModules = getAllowedModules(department, false, userId);
  return allowedModules.length > 0 ? allowedModules[0].path : "/user-dashboard";
};
