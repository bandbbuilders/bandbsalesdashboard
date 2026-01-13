// Department-based module access control
// This defines which modules each department can access

export interface ModuleAccess {
  id: string;
  title: string;
  path: string;
}

// Define allowed modules per department
export const DEPARTMENT_MODULES: Record<string, string[]> = {
  "Marketing": ["content", "tasks", "crm"],
  "Accounting": ["accounting", "sales", "commission-management", "attendance"],
  "Finance": ["accounting", "sales", "commission-management", "attendance"],
  "Sales": ["sales"],
  "Operations": ["tasks", "attendance", "crm"],
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
// Get allowed modules for a department
// If isCeoCoo is true, return all modules
export const getAllowedModules = (department: string | null, isCeoCoo: boolean = false): ModuleAccess[] => {
  if (isCeoCoo) return ALL_MODULES;
  if (!department) return [];
  
  const allowedModuleIds = DEPARTMENT_MODULES[department] || [];
  return ALL_MODULES.filter(module => allowedModuleIds.includes(module.id));
};

// Check if a department can access a specific module
export const canAccessModule = (department: string | null, moduleId: string): boolean => {
  if (!department) return false;
  
  const allowedModuleIds = DEPARTMENT_MODULES[department] || [];
  return allowedModuleIds.includes(moduleId);
};

// Get the default route for a department (first allowed module)
export const getDefaultRoute = (department: string | null): string => {
  const allowedModules = getAllowedModules(department);
  return allowedModules.length > 0 ? allowedModules[0].path : "/user-dashboard";
};
