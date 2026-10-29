import { renderWithProviders, screen, waitFor } from '@/test/helpers'
import AdminDashboard from './AdminDashboard'

// The Content tab stays mounted while hidden, so its requests are answered too
const responses: Record<string, unknown> = {
  '/admin/dashboard-config': { sections: [], courses: [] },
  '/lessons': [],
}

vi.mock('@/api', () => ({
  default: {
    get: vi.fn((url: string) => Promise.resolve({ data: responses[url] ?? { users: [], totalUsers: 0 } })),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

describe('AdminDashboard', () => {
  it('renders admin view', async () => {
    renderWithProviders(<AdminDashboard />)
    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument()
    })
  })
})
