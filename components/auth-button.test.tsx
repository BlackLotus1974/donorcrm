import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthButton } from './auth-button'

// Mock the supabase client
const mockSignOut = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
      getUser: jest.fn().mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null
      })
    }
  })
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('AuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders sign out button when user is authenticated', async () => {
    render(<AuthButton />)
    
    // Wait for the component to load user data
    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })
  })

  it('calls signOut when sign out button is clicked', async () => {
    render(<AuthButton />)
    
    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })
    
    const signOutButton = screen.getByText('Sign out')
    fireEvent.click(signOutButton)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('redirects to login page after successful sign out', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })
    
    render(<AuthButton />)
    
    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })
    
    const signOutButton = screen.getByText('Sign out')
    fireEvent.click(signOutButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('renders sign in link when user is not authenticated', async () => {
    // Mock no user
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: null
    })

    jest.doMock('@/lib/supabase/client', () => ({
      createClient: () => ({
        auth: {
          signOut: mockSignOut,
          getUser: mockGetUser
        }
      })
    }))

    render(<AuthButton />)
    
    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument()
    })
  })
})