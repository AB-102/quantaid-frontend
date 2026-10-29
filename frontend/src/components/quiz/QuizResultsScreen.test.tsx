import { render, screen } from '@testing-library/react'
import QuizResultsScreen from './QuizResultsScreen'

describe('QuizResultsScreen', () => {
  it('shows a pass as a completed lesson', () => {
    render(
      <QuizResultsScreen
        score={8}
        totalQuestions={10}
        passed
        passPercent={70}
        durationMinutes={2}
        durationSeconds={30}
      />
    )
    expect(screen.getByText(/80%/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lesson complete!' })).toBeInTheDocument()
    expect(screen.queryByText(/to pass/)).not.toBeInTheDocument()
  })

  it('shows a fail with the score needed to pass', () => {
    render(
      <QuizResultsScreen
        score={6}
        totalQuestions={10}
        passed={false}
        passPercent={70}
        durationMinutes={2}
        durationSeconds={30}
      />
    )
    expect(screen.getByRole('heading', { name: 'Not quite there yet' })).toBeInTheDocument()
    expect(screen.getByText('You need 70% to pass. Review the lesson, then try the quiz again.')).toBeInTheDocument()
  })
})
