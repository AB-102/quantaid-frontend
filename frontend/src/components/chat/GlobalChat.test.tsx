import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import GlobalChat from './GlobalChat'

vi.mock('@/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }) },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

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
})
