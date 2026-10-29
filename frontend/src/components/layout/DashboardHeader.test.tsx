import { render, screen } from '@testing-library/react'
import React from 'react'
import DashboardHeader from './DashboardHeader'

const renderHeader = (view: 'dashboard' | 'lesson', chatOpen = false) =>
  render(
    <DashboardHeader
      searchQuery=""
      onSearchChange={vi.fn()}
      onSearchSubmit={vi.fn()}
      view={view}
      quizOpen={false}
      chatOpen={chatOpen}
      chatButtonRef={React.createRef<HTMLButtonElement>()}
      onChatToggle={vi.fn()}
      headerStyle={{}}
    />
  )

describe('DashboardHeader', () => {
  it('renders search bar', () => {
    renderHeader('dashboard')
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('has a Chat button on lessons that says whether the chat panel is open', () => {
    renderHeader('lesson')
    const button = screen.getByRole('button', { name: 'Chat' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'ai-chat-panel')
  })

  it('hides the Chat button while the panel, which covers it, is open', () => {
    renderHeader('lesson', true)
    const button = screen.getByRole('button', { name: 'Chat', hidden: true })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveClass('invisible')
  })
})
