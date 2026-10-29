import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WelcomeVideoStep from './WelcomeVideoStep'

describe('WelcomeVideoStep', () => {
  it('shows the welcome video, and both buttons go on to the app', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<WelcomeVideoStep totalSteps={5} onFinish={onFinish} />)

    expect(screen.getByRole('heading', { name: "You're all set!" })).toBeInTheDocument()
    expect(document.querySelector('video source')).toHaveAttribute('type', 'video/mp4')

    await user.click(screen.getByRole('button', { name: 'SKIP VIDEO' }))
    await user.click(screen.getByRole('button', { name: 'START LEARNING' }))
    expect(onFinish).toHaveBeenCalledTimes(2)
  })
})
