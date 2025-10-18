import { hasPermission, canAccessRoute, getRoleName, getAssignableRoles, canPerformAction } from './permissions'
import type { UserRole } from './types'

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should grant access when user has required role', () => {
      expect(hasPermission('admin', ['admin'])).toBe(true)
      expect(hasPermission('manager', ['manager'])).toBe(true)
      expect(hasPermission('user', ['user'])).toBe(true)
      expect(hasPermission('viewer', ['viewer'])).toBe(true)
    })

    it('should grant access when user has higher role', () => {
      expect(hasPermission('admin', ['manager'])).toBe(true)
      expect(hasPermission('admin', ['user'])).toBe(true)
      expect(hasPermission('admin', ['viewer'])).toBe(true)
      expect(hasPermission('manager', ['user'])).toBe(true)
      expect(hasPermission('manager', ['viewer'])).toBe(true)
      expect(hasPermission('user', ['viewer'])).toBe(true)
    })

    it('should deny access when user has lower role', () => {
      expect(hasPermission('viewer', ['user'])).toBe(false)
      expect(hasPermission('viewer', ['manager'])).toBe(false)
      expect(hasPermission('viewer', ['admin'])).toBe(false)
      expect(hasPermission('user', ['manager'])).toBe(false)
      expect(hasPermission('user', ['admin'])).toBe(false)
      expect(hasPermission('manager', ['admin'])).toBe(false)
    })

    it('should handle multiple required roles', () => {
      expect(hasPermission('admin', ['admin', 'manager'])).toBe(true)
      expect(hasPermission('manager', ['admin', 'manager'])).toBe(true)
      expect(hasPermission('user', ['admin', 'manager'])).toBe(false)
    })
  })

  describe('canAccessRoute', () => {
    it('should allow access to public routes for all users', () => {
      expect(canAccessRoute('/', 'viewer', true)).toEqual({ canAccess: true })
      expect(canAccessRoute('/auth/login', 'user', false)).toEqual({ canAccess: true })
    })

    it('should redirect users with organization to dashboard from onboarding', () => {
      expect(canAccessRoute('/onboarding', 'user', true)).toEqual({
        canAccess: false,
        redirectTo: '/dashboard'
      })
    })

    it('should allow onboarding access for users without organization', () => {
      expect(canAccessRoute('/onboarding', 'user', false)).toEqual({ canAccess: true })
    })

    it('should redirect users without organization to onboarding', () => {
      expect(canAccessRoute('/donors', 'user', false)).toEqual({
        canAccess: false,
        redirectTo: '/onboarding'
      })
    })

    it('should enforce role-based access for protected routes', () => {
      expect(canAccessRoute('/settings', 'user', true)).toEqual({
        canAccess: false,
        redirectTo: '/dashboard'
      })
      
      expect(canAccessRoute('/settings', 'admin', true)).toEqual({ canAccess: true })
    })
  })

  describe('getRoleName', () => {
    it('should return proper role names', () => {
      expect(getRoleName('admin')).toBe('Administrator')
      expect(getRoleName('manager')).toBe('Manager')
      expect(getRoleName('user')).toBe('User')
      expect(getRoleName('viewer')).toBe('Viewer')
    })
  })

  describe('getAssignableRoles', () => {
    it('should return correct assignable roles for admin', () => {
      const roles = getAssignableRoles('admin')
      expect(roles).toEqual(['viewer', 'user', 'manager', 'admin'])
    })

    it('should return correct assignable roles for manager', () => {
      const roles = getAssignableRoles('manager')
      expect(roles).toEqual(['viewer', 'user'])
    })

    it('should return empty array for user and viewer', () => {
      expect(getAssignableRoles('user')).toEqual([])
      expect(getAssignableRoles('viewer')).toEqual([])
    })
  })

  describe('canPerformAction', () => {
    it('should allow donor operations based on role', () => {
      expect(canPerformAction('create_donor', 'admin')).toBe(true)
      expect(canPerformAction('create_donor', 'manager')).toBe(true)
      expect(canPerformAction('create_donor', 'user')).toBe(true)
      expect(canPerformAction('create_donor', 'viewer')).toBe(false)
    })

    it('should restrict admin operations', () => {
      expect(canPerformAction('manage_users', 'admin')).toBe(true)
      expect(canPerformAction('manage_users', 'manager')).toBe(false)
      expect(canPerformAction('manage_users', 'user')).toBe(false)
      expect(canPerformAction('manage_users', 'viewer')).toBe(false)
    })

    it('should handle campaign operations', () => {
      expect(canPerformAction('create_campaign', 'admin')).toBe(true)
      expect(canPerformAction('create_campaign', 'manager')).toBe(true)
      expect(canPerformAction('create_campaign', 'user')).toBe(false)
      expect(canPerformAction('create_campaign', 'viewer')).toBe(false)
    })

    it('should return false for unknown actions', () => {
      expect(canPerformAction('unknown_action', 'admin')).toBe(false)
    })
  })
})