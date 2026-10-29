import { act, renderHook } from '@testing-library/react'
import { useDashboardLayout } from './useDashboardLayout'

const setWindowWidth = (width: number) => {
  act(() => {
    window.innerWidth = width
    window.dispatchEvent(new Event('resize'))
  })
}

describe('useDashboardLayout', () => {
  it('collapses the sidebar while the chat is open on a narrow screen', () => {
    setWindowWidth(1200)
    const { result } = renderHook(() => useDashboardLayout())
    expect(result.current.sidebarCollapsed).toBe(false)

    act(() => { result.current.handleChatToggle() })
    expect(result.current.sidebarCollapsed).toBe(true)
  })

  it('expands the sidebar when the chat is closed without the toggle', () => {
    setWindowWidth(1200)
    const { result } = renderHook(() => useDashboardLayout())
    act(() => { result.current.handleChatToggle() })

    act(() => { result.current.setChatOpen(false) })
    expect(result.current.sidebarCollapsed).toBe(false)
  })

  it('expands the sidebar when the window widens with the chat open', () => {
    setWindowWidth(1200)
    const { result } = renderHook(() => useDashboardLayout())
    act(() => { result.current.handleChatToggle() })

    setWindowWidth(1600)
    expect(result.current.sidebarCollapsed).toBe(false)
  })

  it('keeps the sidebar expanded when the chat opens on a wide screen', () => {
    setWindowWidth(1600)
    const { result } = renderHook(() => useDashboardLayout())

    act(() => { result.current.handleChatToggle() })
    expect(result.current.sidebarCollapsed).toBe(false)
  })
})
