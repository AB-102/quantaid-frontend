describe('api', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('calls the page\'s own origin when VITE_BACKEND_URL is unset, as in the self-hosted image', async () => {
    vi.stubEnv('VITE_BACKEND_URL', undefined)
    const { default: api } = await import('./api')
    expect(api.defaults.baseURL).toBe('/api')
  })

  it('calls the configured backend otherwise', async () => {
    vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:8000')
    const { default: api } = await import('./api')
    expect(api.defaults.baseURL).toBe('http://localhost:8000/api')
  })
})
