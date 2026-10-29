import { render, screen } from '@testing-library/react'
import LessonBlocks from './LessonBlocks'
import LessonText from './LessonText'

vi.mock('@/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

describe('LessonText', () => {
  it('renders Markdown and TeX math', () => {
    const { container } = render(
      <LessonText markdown={'A state $\\ket{\\psi}$ with **complex** amplitudes.\n\n$$|\\alpha|^2 + |\\beta|^2 = 1$$'} />,
    )
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
    expect(container.querySelectorAll('.katex-display')).toHaveLength(1)
    expect(screen.getByText('complex').tagName).toBe('STRONG')
  })

  it('displays $$ math as a block whether or not the $$ are on lines of their own', () => {
    const { container } = render(<LessonText markdown={'$$\nx = 1\n$$\n\nText $$y$$ inline.'} />)
    expect(container.querySelectorAll('.katex-display')).toHaveLength(1)
    expect(container.querySelectorAll('.katex')).toHaveLength(2)
  })

  it('shows a bad formula instead of failing', () => {
    const { container } = render(<LessonText markdown={'Broken $\\frac{1$ formula'} />)
    expect(container.textContent).toContain('formula')
  })

  it('keeps one-line text literal in inline mode', () => {
    const { container } = render(<LessonText markdown="1. Introduction" inline />)
    expect(container.querySelector('ol')).toBeNull()
    expect(container.textContent).toBe('1. Introduction')
  })

  it('never renders raw HTML', () => {
    const { container } = render(<LessonText markdown={'<img src=x onerror=alert(1)> and <b>bold</b>'} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })
})

describe('LessonBlocks glossary', () => {
  it('underlines a term once per lesson, with its definition as an accessible tooltip', () => {
    render(
      <LessonBlocks
        blocks={[
          { type: 'heading', text: 'Qubits' },
          { type: 'paragraph', text: 'A qubit holds quantum information. Qubits can be entangled.' },
          { type: 'paragraph', text: 'Every qubit is measured in the end.' },
        ]}
        terms={{ qubit: 'The basic unit of quantum information.' }}
      />,
    )
    const terms = document.querySelectorAll('dfn')
    expect(terms).toHaveLength(1)
    expect(terms[0].firstChild?.textContent).toBe('qubit')
    const tooltip = screen.getByRole('tooltip', { hidden: true })
    expect(tooltip).toHaveTextContent('The basic unit of quantum information.')
    expect(terms[0]).toHaveAttribute('aria-describedby', tooltip.id)
  })
})
