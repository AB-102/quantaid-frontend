import { render, screen, waitFor } from '@testing-library/react'
import UpdateBanner from './UpdateBanner'

function servePage(entryScript: string) {
  const html = `<html><head><script type="module" crossorigin src="${entryScript}"></script></head></html>`
  const fetchMock = vi.fn().mockResolvedValue({ text: () => Promise.resolve(html) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('UpdateBanner', () => {
  let runningScript: HTMLScriptElement

  beforeEach(() => {
    // The banner is off on the dev server, which Vitest's environment looks like
    vi.stubEnv('DEV', false)
    runningScript = document.createElement('script')
    runningScript.type = 'module'
    runningScript.src = '/assets/index-old.js'
    document.head.appendChild(runningScript)
  })

  afterEach(() => {
    runningScript.remove()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('offers a reload when the site serves a different build', async () => {
    servePage('/assets/index-new.js')
    render(<UpdateBanner />)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(await screen.findByRole('status')).toHaveTextContent('Quantaid has been updated.')
  })

  it('stays hidden while the site serves the running build', async () => {
    const fetchMock = servePage('/assets/index-old.js')
    render(<UpdateBanner />)
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => { expect(fetchMock).toHaveBeenCalledWith('/', { cache: 'no-store' }) })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
