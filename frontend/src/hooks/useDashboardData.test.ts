import { renderHook, waitFor } from '@testing-library/react'
import type { Course, DashboardConfig } from '@/types/course'
import { useDashboardData } from './useDashboardData'

const course = (id: number, topics: { id: number; implemented: boolean }[]): Course => ({
  id,
  title: `Course ${id}`,
  description: '',
  image: 'lesson-0',
  concepts: [{ id: `concept-${id}`, title: 'Concept', topics: topics.map(t => ({ ...t, title: `Topic ${t.id}` })) }],
})

let config: DashboardConfig
let passedTopics: number[]

vi.mock('@/api', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/dashboard-config') return Promise.resolve({ data: config })
      if (url === '/me/progress') {
        return Promise.resolve({ data: { completedQuizzes: passedTopics.map(courseId => ({ courseId, passed: true, score: 4, timestamp: '' })) } })
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    }),
    put: vi.fn(),
  },
  setUnauthorizedHandler: vi.fn(),
  BACKEND_URL: 'http://localhost:5000',
}))

const renderData = async () => {
  const { result } = renderHook(() => useDashboardData({ currentLesson: null }))
  await waitFor(() => {
    expect(result.current.isLoadingProgress).toBe(false)
    expect(result.current.activeCourses.length).toBeGreaterThan(0)
  })
  return result.current
}

describe('useDashboardData course unlocking', () => {
  beforeEach(() => {
    // Shown order: course 5, then 7 (nothing published yet), then 2; course 9 isn't on the dashboard
    config = {
      sections: [
        { id: 'second', title: 'Second', order: 1, courses: [2] },
        { id: 'first', title: 'First', order: 0, courses: [5, 7] },
      ],
      courses: [
        course(2, [{ id: 20, implemented: true }]),
        course(5, [{ id: 50, implemented: true }, { id: 51, implemented: false }]),
        course(7, [{ id: 70, implemented: false }]),
        course(9, [{ id: 90, implemented: true }]),
      ],
    }
    passedTopics = []
  })

  it('opens the first course shown, whatever its id', async () => {
    const data = await renderData()
    expect(data.isCourseUnlocked(5)).toBe(true)
    expect(data.isCourseUnlocked(2)).toBe(false)
  })

  it('opens the next published course once the one before is complete, skipping courses with nothing published', async () => {
    passedTopics = [50]
    const data = await renderData()
    expect(data.isCourseUnlocked(7)).toBe(true)
    expect(data.isCourseUnlocked(2)).toBe(true)
    expect(data.isTopicUnlocked(20)).toBe(true)
  })

  it('keeps courses that are off the dashboard locked', async () => {
    passedTopics = [50, 20]
    const data = await renderData()
    expect(data.isCourseUnlocked(9)).toBe(false)
  })
})
