import { UserRole, RoutePermission } from './types';

// Role hierarchy - higher roles include permissions of lower roles
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'viewer': 1,
  'user': 2,
  'manager': 3,
  'admin': 4
};

// Route permissions configuration
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Dashboard - all authenticated users
  { path: '/dashboard', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: true },
  
  // Donor management
  { path: '/donors', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/donors/new', requiredRoles: ['user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/donors/[id]/edit', requiredRoles: ['user', 'manager', 'admin'], requiresOrganization: true },
  
  // Campaign management
  { path: '/campaigns', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/campaigns/new', requiredRoles: ['manager', 'admin'], requiresOrganization: true },

  // Reporting
  { path: '/reports', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/reports/advanced', requiredRoles: ['manager', 'admin'], requiresOrganization: true },

  // Context Templates
  { path: '/context-templates', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/context-templates/new', requiredRoles: ['user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/context-templates/[id]', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: true },
  { path: '/context-templates/[id]/edit', requiredRoles: ['user', 'manager', 'admin'], requiresOrganization: true },
  
  // Settings and administration
  { path: '/settings', requiredRoles: ['manager', 'admin'], requiresOrganization: true },
  { path: '/settings/users', requiredRoles: ['admin'], requiresOrganization: true },
  { path: '/settings/organization', requiredRoles: ['admin'], requiresOrganization: true },
  
  // Organization setup (special case - for users without organization)
  { path: '/onboarding', requiredRoles: ['viewer', 'user', 'manager', 'admin'], requiresOrganization: false },
];

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm',
  '/auth/error',
  '/auth/sign-up-success'
];

// Routes that require authentication but no organization (onboarding flow)
export const ONBOARDING_ROUTES = [
  '/onboarding',
  '/onboarding/organization',
  '/onboarding/profile'
];

/**
 * Check if a user role has permission to access a resource
 */
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole];
  return requiredRoles.some(role => userLevel >= ROLE_HIERARCHY[role]);
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(path: string, userRole: UserRole, hasOrganization: boolean): {
  canAccess: boolean;
  redirectTo?: string;
} {
  // Check if it's a public route
  if (PUBLIC_ROUTES.some(route => path === route || path.startsWith(route))) {
    return { canAccess: true };
  }

  // Check if it's an onboarding route
  if (ONBOARDING_ROUTES.some(route => path === route || path.startsWith(route))) {
    // If user already has organization, redirect to dashboard
    if (hasOrganization) {
      return { canAccess: false, redirectTo: '/dashboard' };
    }
    return { canAccess: true };
  }

  // Find matching route permission
  const routePermission = ROUTE_PERMISSIONS.find(permission => {
    // Exact match
    if (permission.path === path) return true;
    
    // Dynamic route matching (e.g., /donors/[id]/edit)
    const pathSegments = path.split('/');
    const permissionSegments = permission.path.split('/');
    
    if (pathSegments.length !== permissionSegments.length) return false;
    
    return permissionSegments.every((segment, index) => {
      return segment.startsWith('[') && segment.endsWith(']') || segment === pathSegments[index];
    });
  });

  // If no specific permission found, check for parent routes
  if (!routePermission) {
    const parentPath = path.split('/').slice(0, -1).join('/') || '/';
    const parentPermission = ROUTE_PERMISSIONS.find(p => p.path === parentPath);
    
    if (parentPermission) {
      if (!hasPermission(userRole, parentPermission.requiredRoles)) {
        return { canAccess: false, redirectTo: '/dashboard' };
      }
      if (parentPermission.requiresOrganization && !hasOrganization) {
        return { canAccess: false, redirectTo: '/onboarding' };
      }
      return { canAccess: true };
    }
    
    // Default: require organization for protected routes
    if (!hasOrganization) {
      return { canAccess: false, redirectTo: '/onboarding' };
    }
    
    return { canAccess: true };
  }

  // Check role permissions
  if (!hasPermission(userRole, routePermission.requiredRoles)) {
    return { canAccess: false, redirectTo: routePermission.redirectTo || '/dashboard' };
  }

  // Check organization requirement
  if (routePermission.requiresOrganization && !hasOrganization) {
    return { canAccess: false, redirectTo: '/onboarding' };
  }

  return { canAccess: true };
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    'viewer': 'Viewer',
    'user': 'User',
    'manager': 'Manager', 
    'admin': 'Administrator'
  };
  return roleNames[role];
}

/**
 * Get available roles that can be assigned by the current user
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  const currentLevel = ROLE_HIERARCHY[currentUserRole];
  
  // Admins can assign any role
  if (currentUserRole === 'admin') {
    return ['viewer', 'user', 'manager', 'admin'];
  }
  
  // Managers can assign viewer and user roles
  if (currentUserRole === 'manager') {
    return ['viewer', 'user'];
  }
  
  // Users and viewers cannot assign roles
  return [];
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(action: string, userRole: UserRole): boolean {
  const actionPermissions: Record<string, UserRole[]> = {
    'create_donor': ['user', 'manager', 'admin'],
    'edit_donor': ['user', 'manager', 'admin'],
    'delete_donor': ['manager', 'admin'],
    'create_campaign': ['manager', 'admin'],
    'edit_campaign': ['manager', 'admin'],
    'delete_campaign': ['admin'],
    'manage_users': ['admin'],
    'manage_organization': ['admin'],
    'view_reports': ['viewer', 'user', 'manager', 'admin'],
    'export_data': ['manager', 'admin'],
    'import_data': ['manager', 'admin'],
    'create_context_template': ['user', 'manager', 'admin'],
    'edit_context_template': ['user', 'manager', 'admin'],
    'delete_context_template': ['manager', 'admin'],
    'view_context_templates': ['viewer', 'user', 'manager', 'admin'],
    'export_context_template': ['user', 'manager', 'admin'],
    'manage_collaborators': ['user', 'manager', 'admin'],
    'approve_template': ['manager', 'admin'],
    'clone_template': ['user', 'manager', 'admin']
  };

  const requiredRoles = actionPermissions[action];
  if (!requiredRoles) return false;
  
  return hasPermission(userRole, requiredRoles);
}