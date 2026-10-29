import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/AuthContext'

function AllProviders({ children, route }: { children: React.ReactNode; route: string }) {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    </AuthProvider>
  )
}

// `route` is the URL the router starts at, e.g. '/?rice_error=failed'
export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', ...options }: Omit<RenderOptions, 'wrapper'> & { route?: string } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => <AllProviders route={route}>{children}</AllProviders>,
    ...options,
  })
}

export { act, render, screen, waitFor, within } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
