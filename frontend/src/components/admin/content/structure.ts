// Edits to the dashboard structure: sections hold courses, courses hold concepts, concepts hold topics.
// A topic is a lesson: its id is the lesson's courseId. Every function returns a new config.

import type { Concept, Course, DashboardConfig, DashboardSection, Topic } from '@/types/course';

// What the workspace has open. A "lesson" is one that no topic points at.
export type Selection =
  | { kind: 'section'; sectionId: string }
  | { kind: 'course'; courseId: number }
  | { kind: 'concept'; courseId: number; conceptId: string }
  | { kind: 'topic'; courseId: number; conceptId: string; topicId: number }
  | { kind: 'lesson'; lessonId: number };

// Published: students can open it. Coming soon: shown locked. No lesson yet: published, but nothing to show.
export type TopicStatus = 'published' | 'coming-soon' | 'no-lesson';

export const topicStatus = (topic: Topic, lessonIds: Set<number>): TopicStatus => {
  if (!(topic.implemented ?? true)) return 'coming-soon';
  return lessonIds.has(topic.id) ? 'published' : 'no-lesson';
};

export const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export const allTopics = (config: DashboardConfig): Topic[] =>
  config.courses.flatMap(course => course.concepts.flatMap(concept => concept.topics));

export function findTopic(config: DashboardConfig, topicId: number): { course: Course; concept: Concept; topic: Topic } | null {
  for (const course of config.courses) {
    for (const concept of course.concepts) {
      const topic = concept.topics.find(t => t.id === topicId);
      if (topic) return { course, concept, topic };
    }
  }
  return null;
}

export const sectionOfCourse = (config: DashboardConfig, courseId: number): DashboardSection | undefined =>
  config.sections.find(section => section.courses.includes(courseId));

export const unassignedCourses = (config: DashboardConfig): Course[] =>
  config.courses.filter(course => !sectionOfCourse(config, course.id));

// --- Updates ---

export const updateSection = (config: DashboardConfig, sectionId: string, changes: Partial<DashboardSection>): DashboardConfig => ({
  ...config,
  sections: config.sections.map(section => section.id === sectionId ? { ...section, ...changes } : section),
});

export const updateCourse = (config: DashboardConfig, courseId: number, changes: Partial<Course>): DashboardConfig => ({
  ...config,
  courses: config.courses.map(course => course.id === courseId ? { ...course, ...changes } : course),
});

const updateConcepts = (config: DashboardConfig, courseId: number, update: (concepts: Concept[]) => Concept[]): DashboardConfig => ({
  ...config,
  courses: config.courses.map(course => course.id === courseId ? { ...course, concepts: update(course.concepts) } : course),
});

export const updateConcept = (config: DashboardConfig, courseId: number, conceptId: string, changes: Partial<Concept>): DashboardConfig =>
  updateConcepts(config, courseId, concepts => concepts.map(c => c.id === conceptId ? { ...c, ...changes } : c));

const updateTopics = (config: DashboardConfig, courseId: number, conceptId: string, update: (topics: Topic[]) => Topic[]): DashboardConfig =>
  updateConcepts(config, courseId, concepts => concepts.map(c => c.id === conceptId ? { ...c, topics: update(c.topics) } : c));

export const updateTopic = (config: DashboardConfig, courseId: number, conceptId: string, topicId: number, changes: Partial<Topic>): DashboardConfig =>
  updateTopics(config, courseId, conceptId, topics => topics.map(t => t.id === topicId ? { ...t, ...changes } : t));

// --- Adding ---

export function addSection(config: DashboardConfig): { config: DashboardConfig; section: DashboardSection } {
  const section: DashboardSection = { id: `section-${Date.now()}`, title: 'Untitled section', order: config.sections.length, courses: [] };
  return { config: { ...config, sections: [...config.sections, section] }, section };
}

export function addCourse(config: DashboardConfig, sectionId: string | null): { config: DashboardConfig; course: Course } {
  const id = Math.max(-1, ...config.courses.map(c => c.id)) + 1;
  const course: Course = {
    id,
    title: 'Untitled course',
    description: '',
    image: 'lesson-0',
    concepts: [{ id: `concept-${Date.now()}`, title: 'Untitled concept', topics: [] }],
  };
  const sections = sectionId === null ? config.sections : config.sections.map(section =>
    section.id === sectionId ? { ...section, courses: [...section.courses, id] } : section);
  return { config: { ...config, courses: [...config.courses, course], sections }, course };
}

export function addConcept(config: DashboardConfig, courseId: number): { config: DashboardConfig; concept: Concept } {
  const concept: Concept = { id: `concept-${Date.now()}`, title: 'Untitled concept', topics: [] };
  return { config: updateConcepts(config, courseId, concepts => [...concepts, concept]), concept };
}

// A topic's id is its lesson's courseId, so a new one skips every id a topic or a lesson already has.
// `lessonId` adds a topic for an existing lesson instead.
export function addTopic(
  config: DashboardConfig, courseId: number, conceptId: string, lessonIds: Set<number>, lessonId?: number,
): { config: DashboardConfig; topic: Topic } {
  const id = lessonId ?? Math.max(-1, ...allTopics(config).map(t => t.id), ...lessonIds) + 1;
  const topic: Topic = { id, title: 'Untitled topic', description: '', implemented: false };
  return { config: updateTopics(config, courseId, conceptId, topics => [...topics, topic]), topic };
}

// --- Removing (lessons are never deleted here; a topic's lesson stays, off the dashboard) ---

export const removeSection = (config: DashboardConfig, sectionId: string): DashboardConfig => ({
  ...config,
  sections: config.sections.filter(s => s.id !== sectionId).map((s, order) => ({ ...s, order })),
});

export const removeCourse = (config: DashboardConfig, courseId: number): DashboardConfig => ({
  courses: config.courses.filter(c => c.id !== courseId),
  sections: config.sections.map(s => ({ ...s, courses: s.courses.filter(id => id !== courseId) })),
});

export const removeConcept = (config: DashboardConfig, courseId: number, conceptId: string): DashboardConfig =>
  updateConcepts(config, courseId, concepts => concepts.filter(c => c.id !== conceptId));

export const removeTopic = (config: DashboardConfig, courseId: number, conceptId: string, topicId: number): DashboardConfig =>
  updateTopics(config, courseId, conceptId, topics => topics.filter(t => t.id !== topicId));

// --- Moving ---

export const moveSection = (config: DashboardConfig, from: number, to: number): DashboardConfig => {
  const sorted = [...config.sections].sort((a, b) => a.order - b.order);
  return { ...config, sections: moveItem(sorted, from, to).map((s, order) => ({ ...s, order })) };
};

export const moveCourseInSection = (config: DashboardConfig, sectionId: string, from: number, to: number): DashboardConfig =>
  updateSection(config, sectionId, { courses: moveItem(sectionCourses(config, sectionId), from, to) });

const sectionCourses = (config: DashboardConfig, sectionId: string): number[] =>
  config.sections.find(s => s.id === sectionId)?.courses ?? [];

// Puts a course at the end of another section, or takes it off the dashboard (null)
export const setCourseSection = (config: DashboardConfig, courseId: number, sectionId: string | null): DashboardConfig => ({
  ...config,
  sections: config.sections.map(section => {
    const without = section.courses.filter(id => id !== courseId);
    return { ...section, courses: section.id === sectionId ? [...without, courseId] : without };
  }),
});

export const moveConcept = (config: DashboardConfig, courseId: number, from: number, to: number): DashboardConfig =>
  updateConcepts(config, courseId, concepts => moveItem(concepts, from, to));

export const moveTopic = (config: DashboardConfig, courseId: number, conceptId: string, from: number, to: number): DashboardConfig =>
  updateTopics(config, courseId, conceptId, topics => moveItem(topics, from, to));
