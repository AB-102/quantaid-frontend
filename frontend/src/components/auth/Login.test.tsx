import { act, renderWithProviders, screen } from '@/test/helpers'
import Login from './Login'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

// A Render URL, like staging, so the cold-start note can show
vi.mock('@/api', () => ({
  default: { get: mockGet, post: vi.fn().mockResolvedValue({ data: {} }) },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'https://quantaid-api-staging-public.onrender.com',
}))

function mockAuthConfig(config: object) {
  mockGet.mockImplementation((url: string) => Promise.resolve({ data: url === '/auth/config' ? config : {} }))
}

// A backend that hasn't answered yet, like a sleeping Render service
function mockBackendAsleep() {
  mockGet.mockReturnValue(new Promise(() => {}))
}

describe('Login', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the Google sign-in button on a Google deployment', async () => {
    mockAuthConfig({ isRiceDeployment: false, googleClientId: 'test-client-id' })
    renderWithProviders(<Login />)
    expect(await screen.findByRole('button', { name: /google/i })).toBeInTheDocument()
    expect(screen.getByText(/log in/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /loading sign-in/i })).not.toBeInTheDocument()
  })

  it('shows only the Rice button on a Rice deployment', async () => {
    mockAuthConfig({ isRiceDeployment: true, googleClientId: null })
    renderWithProviders(<Login />)
    expect(await screen.findByRole('button', { name: /rice student/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })

  it('shows a disabled placeholder while the sign-in config loads', () => {
    mockBackendAsleep()
    renderWithProviders(<Login />)
    expect(screen.getByRole('button', { name: /loading sign-in/i })).toBeDisabled()
  })

  it('explains the Render cold start when the sign-in config is slow to load', () => {
    vi.useFakeTimers()
    mockBackendAsleep()
    renderWithProviders(<Login />)
    expect(screen.queryByText(/hosted on render/i)).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText(/hosted on render/i)).toBeInTheDocument()
  })
})
