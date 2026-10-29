import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Quiz from './Quiz'
import type { Question } from '@/types/quiz'

vi.mock('@/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }) },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

const mockQuestions: Question[] = [
  {
    question: 'What is superposition?',
    options: ['A state of rest', 'Multiple states at once', 'A single state', 'None'],
    correctAnswer: 1,
    explanation: 'Superposition means a qubit can be in multiple states simultaneously.',
  },
]

describe('Quiz', () => {
  it('renders quiz question', () => {
    render(
      <Quiz
        questions={mockQuestions}
        onComplete={vi.fn()}
        onExit={vi.fn()}
        onRetry={vi.fn()}
        courseId={0}
      />
    )
    expect(screen.getByText('What is superposition?')).toBeInTheDocument()
  })
})

describe('Quiz review', () => {
  it('shows the lesson content the question is linked to', async () => {
    const user = userEvent.setup()
    render(
      <Quiz
        questions={[{ ...mockQuestions[0], lessonBlockIds: ['superposition'] }]}
        lessonContent={{
          title: 'Basic Principles',
          blocks: [
            { type: 'paragraph', text: 'An unrelated opening paragraph.' },
            { type: 'paragraph', text: 'A qubit in superposition is in **both** states.', id: 'superposition' },
          ],
        }}
        onComplete={vi.fn()}
        onExit={vi.fn()}
        onRetry={vi.fn()}
        courseId={0}
      />
    )
    await user.click(screen.getByRole('button', { name: /Multiple states at once/ }))
    await user.click(screen.getByRole('button', { name: 'CONTINUE' }))
    await user.click(await screen.findByRole('button', { name: 'REVIEW CONCEPT' }))

    expect(screen.getByText(/A qubit in superposition is in/)).toBeInTheDocument()
    expect(screen.queryByText(/unrelated opening/)).not.toBeInTheDocument()
  })
})

describe('Quiz results', () => {
  it('after a fail, offers to review the lesson or try again instead of continuing', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onRetry = vi.fn()
    render(<Quiz questions={mockQuestions} onComplete={onComplete} onExit={vi.fn()} onRetry={onRetry} courseId={0} />)

    await user.click(screen.getByRole('button', { name: 'SKIP' }))

    expect(await screen.findByRole('heading', { name: 'Not quite there yet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'TRY AGAIN' }))
    expect(onRetry).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'REVIEW LESSON' }))
    expect(onComplete).toHaveBeenCalledWith(0, false)
  })

  it('after a pass, continues', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Quiz questions={mockQuestions} onComplete={onComplete} onExit={vi.fn()} onRetry={vi.fn()} courseId={0} />)

    await user.click(screen.getByRole('button', { name: /Multiple states at once/ }))
    await user.click(screen.getByRole('button', { name: 'CONTINUE' }))
    await user.click(await screen.findByRole('button', { name: 'CONTINUE' }))

    expect(await screen.findByRole('heading', { name: 'Lesson complete!' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'CONTINUE' }))
    expect(onComplete).toHaveBeenCalledWith(1, true)
  })
})
