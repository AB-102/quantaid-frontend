import { act, fireEvent, render, screen } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import React from 'react'
import GlobalChat from './GlobalChat'

const RESETS_AT = '2026-10-30T00:00:00+00:00'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock('@/api', () => ({
  default: api,
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

beforeEach(() => {
  api.get.mockResolvedValue({ data: { used: 12, limit: 50, resetsAt: RESETS_AT } })
  api.post.mockResolvedValue({ data: {} })
})

const httpError = (status: number) => new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
  status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
})

const ChatWithButton: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen, onClose = vi.fn() }) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={buttonRef}>Chat</button>
      <GlobalChat
        isOpen={isOpen}
        onClose={onClose}
        highlightText={null}
        highlightMode={null}
        courseId={0}
        width={420}
        launcherRef={buttonRef}
      />
    </>
  )
}

describe('GlobalChat', () => {
  it('renders when open', () => {
    render(<ChatWithButton isOpen />)
    expect(screen.getByPlaceholderText(/message|ask|type/i)).toBeInTheDocument()
  })

  it('is inert while closed, so its controls are out of the tab order', () => {
    const { rerender } = render(<ChatWithButton isOpen />)
    const panel = screen.getByRole('complementary', { name: 'Chat' })
    expect(panel.inert).toBe(false)
    rerender(<ChatWithButton isOpen={false} />)
    expect(panel.inert).toBe(true)
  })

  it('spills open and closed, but never plays the closing motion on first render', () => {
    const { rerender } = render(<ChatWithButton isOpen={false} />)
    // Hidden elements have no accessible name, so the closed panel is found by its role alone
    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel.style.animation).toBe('none')
    expect(panel).toHaveAttribute('data-open', 'false')

    rerender(<ChatWithButton isOpen />)
    expect(panel.style.animation).toContain('chat-spill-open')
    expect(panel).toHaveAttribute('data-open', 'true')

    rerender(<ChatWithButton isOpen={false} />)
    expect(panel.style.animation).toContain('chat-spill-close')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ChatWithButton isOpen onClose={onClose} />)
    fireEvent.keyDown(screen.getByPlaceholderText(/ask/i), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('gives focus back to the Chat button when it closes with focus inside', () => {
    const { rerender } = render(<ChatWithButton isOpen />)
    expect(screen.getByPlaceholderText(/ask/i)).toHaveFocus()
    rerender(<ChatWithButton isOpen={false} />)
    expect(screen.getByRole('button', { name: 'Chat' })).toHaveFocus()
  })

  it("shows how many of today's AI requests are left", async () => {
    render(<ChatWithButton isOpen />)
    expect(await screen.findByText('AI can make mistakes. 38 of 50 AI requests left today.')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/me/ai-usage')
  })

  it('shows no count when there is no limit', async () => {
    api.get.mockResolvedValueOnce({ data: { used: 0, limit: null, resetsAt: null } })
    render(<ChatWithButton isOpen />)
    await act(async () => {}) // let the usage request finish
    expect(screen.getByText('AI can make mistakes.')).toBeInTheDocument()
    expect(screen.queryByText(/left today/)).not.toBeInTheDocument()
  })

  it('turns off the input once the daily limit is used up', async () => {
    api.get.mockResolvedValueOnce({ data: { used: 50, limit: 50, resetsAt: RESETS_AT } })
    render(<ChatWithButton isOpen />)
    expect(await screen.findByPlaceholderText(/daily limit reached/i)).toBeDisabled()
  })

  it('shows the daily limit in the conversation instead of an alert, and gives the message back', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    api.post.mockRejectedValueOnce(httpError(429))
    render(<ChatWithButton isOpen />)

    const input = screen.getByPlaceholderText(/ask/i)
    fireEvent.change(input, { target: { value: 'What is a qubit?' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByRole('alert')).toHaveTextContent("You've used all of today's AI requests.")
    expect(alertSpy).not.toHaveBeenCalled()
    expect(screen.queryByText('What is a qubit?')).not.toBeInTheDocument()
    expect(input).toHaveValue('What is a qubit?')
    alertSpy.mockRestore()
  })

  it("renders replies as Markdown but shows the student's own message as typed", async () => {
    api.post.mockResolvedValueOnce({ data: { assistantReply: 'A **qubit** can be:\n\n- 0\n- 1' } })
    render(<ChatWithButton isOpen />)

    const input = screen.getByPlaceholderText(/ask/i)
    fireEvent.change(input, { target: { value: 'What is a **qubit**?' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect((await screen.findByText('qubit')).tagName).toBe('STRONG')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('What is a **qubit**?')).toBeInTheDocument()
  })

  it('says the AI service is unavailable when a request fails for another reason', async () => {
    api.post.mockRejectedValueOnce(httpError(502))
    render(<ChatWithButton isOpen />)

    const input = screen.getByPlaceholderText(/ask/i)
    fireEvent.change(input, { target: { value: 'What is a qubit?' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByRole('alert')).toHaveTextContent("The AI service isn't available right now.")
  })
})
