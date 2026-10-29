import { render, screen } from '@testing-library/react'
import React from 'react'
import QuizFooter from './QuizFooter'

const renderFooter = (props: Partial<React.ComponentProps<typeof QuizFooter>> = {}) =>
  render(
    <QuizFooter
      showResultsScreen={false}
      passed={false}
      hasSubmitted={false}
      questionCompleted={false}
      showAnswersEnabled={true}
      isCorrect={null}
      canContinue={false}
      showReviewConcept={false}
      timeModeEnabled={false}
      timeRemaining={60}
      timeLimit={60}
      circumference={100}
      strokeDashoffset={0}
      getTimerColor={() => '#4ade80'}
      onLeaveFeedback={vi.fn()}
      onSkip={vi.fn()}
      onReviewConcept={vi.fn()}
      onCloseReviewConcept={vi.fn()}
      onReviewLesson={vi.fn()}
      onContinue={vi.fn()}
      {...props}
    />
  )

describe('QuizFooter', () => {
  it('renders skip button when question not completed', () => {
    renderFooter()
    expect(screen.getByText(/skip/i)).toBeInTheDocument()
  })

  it('offers only CONTINUE on the results screen after a pass', () => {
    renderFooter({ showResultsScreen: true, passed: true })
    expect(screen.getByRole('button', { name: 'CONTINUE' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'REVIEW LESSON' })).not.toBeInTheDocument()
  })

  it('offers REVIEW LESSON and TRY AGAIN on the results screen after a fail', () => {
    const onReviewLesson = vi.fn()
    renderFooter({ showResultsScreen: true, passed: false, onReviewLesson })
    screen.getByRole('button', { name: 'REVIEW LESSON' }).click()
    expect(onReviewLesson).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'TRY AGAIN' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'CONTINUE' })).not.toBeInTheDocument()
  })
})
