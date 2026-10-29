import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import type { DashboardConfig } from '@/types/course'
import ContentWorkspace from './ContentWorkspace'

const config: DashboardConfig = {
  sections: [{ id: 'basics', title: 'Basics', order: 0, courses: [0] }],
  courses: [{
    id: 0,
    title: 'Intro course',
    description: '',
    image: 'lesson-0',
    concepts: [{
      id: 'c0',
      title: 'Fundamentals',
      topics: [
        { id: 0, title: 'Qubits', implemented: true },
        { id: 81, title: 'Gates', implemented: true },
      ],
    }],
  }],
}

const lesson = {
  courseId: 0,
  title: 'All about qubits',
  blocks: [{ type: 'paragraph', text: 'A qubit can be in **both** states.', id: 'both' }],
  quiz: [{ question: 'What can a qubit be?', options: ['Only 0', 'Both'], correctAnswer: 1, lessonBlockIds: ['both'] }],
  interactiveTerms: {},
}

const notFound = new AxiosError('Not found', 'ERR_BAD_REQUEST', undefined, undefined, {
  status: 404, statusText: 'Not Found', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
})

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() }))

vi.mock('@/api', () => ({
  default: api,
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

beforeEach(() => {
  api.get.mockImplementation((url: string) => {
    if (url === '/admin/dashboard-config') return Promise.resolve({ data: structuredClone(config) })
    if (url === '/lessons') return Promise.resolve({ data: [{ courseId: 0, title: 'All about qubits' }, { courseId: 44, title: 'Old lesson' }] })
    if (url === '/lessons/0') return Promise.resolve({ data: lesson })
    if (url === '/lessons/81') return Promise.reject(notFound)
    return Promise.reject(new Error(`unexpected ${url}`))
  })
  api.put.mockResolvedValue({ data: {} })
  api.patch.mockResolvedValue({ data: {} })
})

const outline = () => within(screen.getByRole('navigation', { name: 'Content outline' }))

describe('ContentWorkspace', () => {
  it('shows the dashboard outline with each topic’s status and lessons that are off the dashboard', async () => {
    const user = userEvent.setup()
    render(<ContentWorkspace />)
    await screen.findByRole("navigation", { name: "Content outline" })
    await user.click(await outline().findByRole('button', { name: 'Expand Intro course' }))
    await user.click(outline().getByRole('button', { name: 'Expand Fundamentals' }))
    expect(outline().getByText('Published')).toBeInTheDocument()
    expect(outline().getByText('No lesson yet')).toBeInTheDocument()
    expect(outline().getByText('Old lesson')).toBeInTheDocument()
  })

  it('opens a topic’s lesson as source with a preview, and saves outline changes', async () => {
    const user = userEvent.setup()
    render(<ContentWorkspace />)
    await screen.findByRole("navigation", { name: "Content outline" })
    await user.click(await outline().findByRole('button', { name: 'Expand Intro course' }))
    await user.click(outline().getByRole('button', { name: 'Expand Fundamentals' }))
    await user.click(outline().getByRole('button', { name: 'Qubits' }))

    expect(await screen.findByLabelText('Lesson title')).toHaveValue('All about qubits')
    const preview = within(screen.getByLabelText('Preview'))
    expect(preview.getByText('both').tagName).toBe('STRONG')
    expect(preview.getByText(/#both: A qubit can be in/)).toBeInTheDocument()
    expect(screen.getByText('No problems. Ready to save.')).toBeInTheDocument()

    expect(screen.getByText('All changes saved')).toBeInTheDocument()
    const topicTitle = screen.getByLabelText('Title')
    await user.clear(topicTitle)
    await user.type(topicTitle, 'What is a qubit?')
    expect(screen.getByText('● Unsaved changes')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('All changes saved')).toBeInTheDocument())
    const [url, body] = api.put.mock.calls[0]
    expect(url).toBe('/admin/dashboard-config')
    expect(JSON.stringify(body)).toContain('What is a qubit?')
    expect(api.patch).not.toHaveBeenCalled() // the lesson itself didn't change
  })

  it('starts a lesson for a topic that has none, and keeps a removed topic’s lesson', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ContentWorkspace />)
    await screen.findByRole("navigation", { name: "Content outline" })
    await user.click(await outline().findByRole('button', { name: 'Expand Intro course' }))
    await user.click(outline().getByRole('button', { name: 'Expand Fundamentals' }))

    await user.click(outline().getByRole('button', { name: 'Gates' }))
    expect(await screen.findByLabelText('Lesson title')).toHaveValue('Gates')
    expect(screen.getByText(/no content yet/)).toBeInTheDocument()

    await user.click(outline().getByRole('button', { name: 'Qubits' }))
    await screen.findByDisplayValue('All about qubits')
    await user.click(screen.getByRole('button', { name: 'Remove topic' }))
    expect(outline().getByText('Lessons not on the dashboard')).toBeInTheDocument()
    expect(outline().getByRole('button', { name: 'All about qubits' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lesson not on the dashboard' })).toBeInTheDocument()
  })
})
