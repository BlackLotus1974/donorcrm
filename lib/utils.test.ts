import { cn, hasEnvVars } from './utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge classnames correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('should override conflicting classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })
  })

  describe('hasEnvVars', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    it('should return true when both env vars are present', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      
      // Re-import to get updated env vars
      jest.resetModules()
      const { hasEnvVars } = require('./utils')
      expect(hasEnvVars).toBe(true)
    })

    it('should return false when env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      jest.resetModules()
      const { hasEnvVars } = require('./utils')
      expect(hasEnvVars).toBe(false)
    })
  })
})