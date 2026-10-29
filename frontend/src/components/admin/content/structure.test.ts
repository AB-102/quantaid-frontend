import type { DashboardConfig } from '@/types/course'
import {
  addCourse, addTopic, moveSection, removeCourse, removeSection, setCourseSection, topicStatus, unassignedCourses,
} from './structure'

const config: DashboardConfig = {
  sections: [
    { id: 'a', title: 'A', order: 0, courses: [0, 1] },
    { id: 'b', title: 'B', order: 1, courses: [] },
  ],
  courses: [
    { id: 0, title: 'Zero', description: '', image: 'lesson-0', concepts: [{ id: 'c0', title: 'C0', topics: [{ id: 0, title: 'T0', implemented: true }] }] },
    { id: 1, title: 'One', description: '', image: 'lesson-0', concepts: [{ id: 'c1', title: 'C1', topics: [{ id: 51, title: 'T51', implemented: false }] }] },
  ],
}

describe('structure', () => {
  it('gives a new topic an id no topic or lesson has, and starts it as coming soon', () => {
    const { config: next, topic } = addTopic(config, 0, 'c0', new Set([0, 51, 80]))
    expect(topic.id).toBe(81)
    expect(topic.implemented).toBe(false)
    expect(next.courses[0].concepts[0].topics.map(t => t.id)).toEqual([0, 81])
  })

  it('can add a topic for an existing lesson', () => {
    expect(addTopic(config, 0, 'c0', new Set([7]), 7).topic.id).toBe(7)
  })

  it('adds a course at the end of a section', () => {
    const { config: next, course } = addCourse(config, 'b')
    expect(course.id).toBe(2)
    expect(next.sections[1].courses).toEqual([2])
  })

  it('takes a deleted course out of its section', () => {
    const next = removeCourse(config, 0)
    expect(next.courses.map(c => c.id)).toEqual([1])
    expect(next.sections[0].courses).toEqual([1])
  })

  it("keeps a deleted section's courses, off the dashboard", () => {
    const next = removeSection(config, 'a')
    expect(next.sections).toEqual([{ id: 'b', title: 'B', order: 0, courses: [] }])
    expect(unassignedCourses(next).map(c => c.id)).toEqual([0, 1])
  })

  it('moves a course to another section, or off the dashboard', () => {
    const moved = setCourseSection(config, 1, 'b')
    expect(moved.sections.map(s => s.courses)).toEqual([[0], [1]])
    expect(unassignedCourses(setCourseSection(config, 1, null)).map(c => c.id)).toEqual([1])
  })

  it('reorders sections and renumbers their order', () => {
    const next = moveSection(config, 0, 1)
    expect(next.sections.map(s => [s.id, s.order])).toEqual([['b', 0], ['a', 1]])
  })

  it('tells published, coming soon and lesson-less topics apart', () => {
    const lessons = new Set([0])
    expect(topicStatus({ id: 0, title: 'T', implemented: true }, lessons)).toBe('published')
    expect(topicStatus({ id: 5, title: 'T', implemented: true }, lessons)).toBe('no-lesson')
    expect(topicStatus({ id: 0, title: 'T', implemented: false }, lessons)).toBe('coming-soon')
  })
})
