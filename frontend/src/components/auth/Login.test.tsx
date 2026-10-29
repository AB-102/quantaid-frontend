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
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains why Rice sign-in sent the user back', async () => {
    mockAuthConfig({ isRiceDeployment: true, googleClientId: null })
    renderWithProviders(<Login />, { route: '/?rice_error=conflict' })
    expect(await screen.findByRole('alert')).toHaveTextContent(/already linked to a different rice account/i)
  })

  it('shows the generic Rice message for a code it does not know', async () => {
    mockAuthConfig({ isRiceDeployment: true, googleClientId: null })
    renderWithProviders(<Login />, { route: '/?rice_error=<script>' })
    expect(await screen.findByRole('alert')).toHaveTextContent("Rice sign-in didn't finish. Please try again.")
  })

  it('explains on hover why the email and password fields are disabled', async () => {
    mockAuthConfig({ isRiceDeployment: false, googleClientId: 'test-client-id' })
    renderWithProviders(<Login />)
    await screen.findByRole('button', { name: /google/i })
    for (const control of [screen.getByLabelText('Email'), screen.getByLabelText('Password'), screen.getByRole('button', { name: /^(SIGN UP|LOG IN)$/ })]) {
      expect(control).toBeDisabled()
      expect(control).toHaveAttribute('title', "Email and password sign-in isn't available. Use the sign-in button above.")
    }
  })

  it('shows a disabled placeholder while the sign-in config loads', () => {
    mockBackendAsleep()
    renderWithProviders(<Login />)
    expect(screen.getByRole('button', { name: /loading sign-in/i })).toBeDisabled()
  })

  it('shows the removed email/password form as a disabled placeholder', () => {
    mockBackendAsleep()
    renderWithProviders(<Login />)
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Name')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'SIGN UP' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms')
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
