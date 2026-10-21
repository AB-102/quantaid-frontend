import { renderWithProviders, screen } from '@/test/helpers'
import Login from './Login'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('@/api', () => ({
  default: { get: mockGet, post: vi.fn().mockResolvedValue({ data: {} }) },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:8000',
}))

function mockAuthConfig(config: object) {
  mockGet.mockImplementation((url: string) => Promise.resolve({ data: url === '/auth/config' ? config : {} }))
}

describe('Login', () => {
  it('shows the Google sign-in button on a Google deployment', async () => {
    mockAuthConfig({ isRiceDeployment: false, googleClientId: 'test-client-id' })
    renderWithProviders(<Login />)
    expect(await screen.findByRole('button', { name: /google/i })).toBeInTheDocument()
    expect(screen.getByText(/log in/i)).toBeInTheDocument()
  })

  it('shows only the Rice button on a Rice deployment', async () => {
    mockAuthConfig({ isRiceDeployment: true, googleClientId: null })
    renderWithProviders(<Login />)
    expect(await screen.findByRole('button', { name: /rice student/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })
})
