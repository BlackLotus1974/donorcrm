import { DonorService } from './donor-service'

// Mock the Supabase client
const mockSelect = jest.fn().mockReturnThis()
const mockInsert = jest.fn().mockReturnThis()
const mockUpdate = jest.fn().mockReturnThis()
const mockEq = jest.fn().mockReturnThis()
const mockSingle = jest.fn()
const mockOrder = jest.fn().mockReturnThis()
const mockRange = jest.fn().mockReturnThis()
const mockOr = jest.fn().mockReturnThis()
const mockIn = jest.fn().mockReturnThis()
const mockOverlaps = jest.fn().mockReturnThis()
const mockGte = jest.fn().mockReturnThis()
const mockLte = jest.fn().mockReturnThis()
const mockNot = jest.fn().mockReturnThis()

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    range: mockRange,
    or: mockOr,
    in: mockIn,
    overlaps: mockOverlaps,
    gte: mockGte,
    lte: mockLte,
    not: mockNot,
  })),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('DonorService', () => {
  let donorService: DonorService

  beforeEach(() => {
    donorService = new DonorService()
    jest.clearAllMocks()
  })

  describe('getDonors', () => {
    it('should fetch donors with pagination', async () => {
      const mockDonors = [
        { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
      ]

      mockSelect.mockResolvedValueOnce({
        data: mockDonors,
        error: null,
        count: 2,
      })

      const result = await donorService.getDonors('org-123', 1, 10)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('donors')
      expect(mockSelect).toHaveBeenCalledWith(expect.any(String), { count: 'exact' })
      expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockOrder).toHaveBeenCalledWith('last_name', { ascending: true })
      expect(mockRange).toHaveBeenCalledWith(0, 9)

      expect(result).toEqual({
        data: mockDonors,
        count: 2,
        page: 1,
        limit: 10,
        total_pages: 1,
      })
    })

    it('should apply search filters', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      await donorService.getDonors('org-123', 1, 10, { search: 'john' })

      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining('john'))
    })

    it('should apply status filters', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      await donorService.getDonors('org-123', 1, 10, { status: ['active', 'inactive'] })

      expect(mockIn).toHaveBeenCalledWith('status', ['active', 'inactive'])
    })

    it('should handle sorting', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      await donorService.getDonors(
        'org-123',
        1,
        10,
        {},
        { field: 'email', direction: 'desc' }
      )

      expect(mockOrder).toHaveBeenCalledWith('email', { ascending: false })
    })
  })

  describe('getDonor', () => {
    it('should fetch a single donor', async () => {
      const mockDonor = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockDonor,
        error: null,
      })

      const result = await donorService.getDonor('1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('donors')
      expect(mockSelect).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', '1')
      expect(mockSingle).toHaveBeenCalled()
      expect(result).toEqual(mockDonor)
    })

    it('should return null if donor not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await donorService.getDonor('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('createDonor', () => {
    it('should create a new donor', async () => {
      const donorData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        donor_type: 'individual' as const,
        status: 'active' as const,
        country: 'US',
        communication_preferences: { email: true },
      }

      const mockCreatedDonor = {
        id: 'new-donor-id',
        ...donorData,
        created_by: 'test-user-id',
        updated_by: 'test-user-id',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockCreatedDonor,
        error: null,
      })

      const result = await donorService.createDonor('org-123', donorData)

      expect(mockInsert).toHaveBeenCalledWith({
        organization_id: 'org-123',
        ...donorData,
        created_by: 'test-user-id',
        updated_by: 'test-user-id',
      })
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSingle).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedDonor)
    })

    it('should return null if creation fails', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Creation failed' },
      })

      const result = await donorService.createDonor('org-123', {
        first_name: 'John',
        last_name: 'Doe',
        donor_type: 'individual',
        status: 'active',
        country: 'US',
      })

      expect(result).toBeNull()
    })
  })

  describe('updateDonor', () => {
    it('should update an existing donor', async () => {
      const updates = {
        first_name: 'Jane',
        email: 'jane@example.com',
      }

      const mockUpdatedDonor = {
        id: 'donor-123',
        ...updates,
        updated_by: 'test-user-id',
      }

      mockSingle.mockResolvedValueOnce({
        data: mockUpdatedDonor,
        error: null,
      })

      const result = await donorService.updateDonor('donor-123', updates)

      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        updated_by: 'test-user-id',
        updated_at: expect.any(String),
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'donor-123')
      expect(result).toEqual(mockUpdatedDonor)
    })
  })

  describe('deleteDonor', () => {
    it('should soft delete a donor', async () => {
      mockUpdate.mockResolvedValueOnce({
        error: null,
      })

      const result = await donorService.deleteDonor('donor-123')

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'inactive',
        updated_at: expect.any(String),
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'donor-123')
      expect(result).toBe(true)
    })

    it('should return false if deletion fails', async () => {
      mockUpdate.mockResolvedValueOnce({
        error: { message: 'Update failed' },
      })

      const result = await donorService.deleteDonor('donor-123')

      expect(result).toBe(false)
    })
  })
})