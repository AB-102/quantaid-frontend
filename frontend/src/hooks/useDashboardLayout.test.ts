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

  it('makes room for the chat however it opens, at its real width', () => {
    setWindowWidth(1600)
    const { result } = renderHook(() => useDashboardLayout())

    // Explain / View Analogy open the chat directly, without the toggle
    act(() => { result.current.setChatOpen(true) })
    expect(result.current.getMainPanelStyles().maxWidth).toBe('calc(100vw - 250px - 420px)')

    // A dragged width is kept through closing and reopening
    act(() => { result.current.handleChatWidthChange(500, false) })
    act(() => { result.current.handleChatToggle() })
    expect(result.current.getMainPanelStyles().maxWidth).toBe('calc(100vw - 250px)')
    act(() => { result.current.handleChatToggle() })
    expect(result.current.getMainPanelStyles().maxWidth).toBe('calc(100vw - 250px - 500px)')
  })
})
