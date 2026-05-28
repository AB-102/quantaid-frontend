// src/components/ContentManager.tsx
// Top-level Content Management view for the admin dashboard.
// Shows dashboard structure (sections, courses, topics) and drills into LessonEditor.

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/api';
import LessonEditor from './LessonEditor';

// --- Types ---

interface Topic {
  id: number;
  title: string;
  description: string;
  implemented: boolean;
}

interface Concept {
  id: string;
  title: string;
  topics: Topic[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  concepts: Concept[];
}

interface Section {
  id: string;
  title: string;
  order: number;
  courses: number[]; // course ids
}

interface DashboardConfig {
  sections: Section[];
  courses: Course[];
}

type ContentView = 'overview' | 'lesson-editor';

// Image options for course cards
const IMAGE_OPTIONS = [
  { value: 'lesson-0', label: 'Quantum Blue' },
  { value: 'lesson-1', label: 'Quantum Purple' },
  { value: 'lesson-2', label: 'Quantum Green' },
];

// Shared class strings
const inputCls  = 'py-2 px-2.5 bg-brand-bg border border-brand-card rounded text-[#E5E7EB] text-[13px] font-inter box-border';
const iconBtnCls = 'bg-transparent border-none text-[#9DA7B7] cursor-pointer text-xs py-0.5 px-1.5 rounded font-inter';
const saveBtnCls = 'py-2 px-4.5 bg-[#1a3b2a] text-success border border-[#166534] rounded-md cursor-pointer text-[13px] font-semibold font-inter';
const cancelBtnCls = 'py-2 px-3.5 bg-brand-card text-[#9DA7B7] border border-brand-card rounded-md cursor-pointer text-[13px] font-inter';
const actionBtnCls = 'py-2 px-3.5 bg-brand-card text-[#9DA7B7] border border-brand-border-dark rounded-md cursor-pointer text-[13px] font-medium font-inter whitespace-nowrap';
const editContentBtnCls = 'py-1 px-2.5 bg-[#1e3a5f] text-[#60a5fa] border border-[#2563eb] rounded cursor-pointer text-[11px] font-medium font-inter';
const addBtnCls = 'py-1 px-3 bg-brand-card text-[#9DA7B7] border border-brand-border-dark rounded cursor-pointer text-xs font-inter mt-1';

const ContentManager: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [contentView, setContentView] = useState<ContentView>('overview');
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());

  // Editing state for sections
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  // Editing state for inline course card editing
  const [editingCardId, setEditingCardId] = useState<number | null>(null);

  // New section form
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // New course form
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseSection, setNewCourseSection] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard-config');
      setConfig(res.data);
    } catch (err) {
      console.error('Error fetching dashboard config:', err);
      setMessage('Failed to load dashboard config');
    }
  }, []);

  useEffect(() => { void fetchConfig(); }, [fetchConfig]);

  // --- Save ---
  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put('/admin/dashboard-config', { sections: config.sections, courses: config.courses });
      setMessage('Dashboard config saved');
    } catch (err: unknown) {
      let msg = 'Failed to save';
      if (axios.isAxiosError<{ error?: string }>(err) && err.response?.data.error) {
        msg = err.response.data.error;
      }
      setMessage(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // --- Section operations ---
  const addSection = () => {
    if (!newSectionTitle.trim() || !config) return;
    const id = newSectionTitle.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newSection: Section = {
      id: id || `section-${Date.now()}`,
      title: newSectionTitle.trim(),
      order: config.sections.length,
      courses: [],
    };
    setConfig({ ...config, sections: [...config.sections, newSection] });
    setNewSectionTitle('');
    setShowNewSection(false);
  };

  const removeSection = (sectionId: string) => {
    if (!config) return;
    const section = config.sections.find(s => s.id === sectionId);
    if (section && section.courses.length > 0) {
      if (!window.confirm(`Section "${section.title}" has ${section.courses.length} course(s). Remove section and unassign its courses?`)) return;
    }
    setConfig({ ...config, sections: config.sections.filter(s => s.id !== sectionId) });
  };

  const moveSection = (idx: number, direction: -1 | 1) => {
    if (!config) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= config.sections.length) return;
    const sections = [...config.sections];
    [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
    sections.forEach((s, i) => s.order = i);
    setConfig({ ...config, sections });
  };

  const renameSectionStart = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
  };

  const renameSectionSave = () => {
    if (!config || !editingSectionId) return;
    setConfig({
      ...config,
      sections: config.sections.map(s =>
        s.id === editingSectionId ? { ...s, title: editingSectionTitle.trim() || s.title } : s
      ),
    });
    setEditingSectionId(null);
  };

  // --- Course operations ---
  const getCourse = (courseId: number): Course | undefined => config?.courses.find(c => c.id === courseId);

  const updateCourse = (courseId: number, updates: Partial<Course>) => {
    if (!config) return;
    setConfig({
      ...config,
      courses: config.courses.map(c => c.id === courseId ? { ...c, ...updates } : c),
    });
  };

  const addCourse = () => {
    if (!newCourseTitle.trim() || !config) return;
    const maxId = config.courses.length > 0 ? Math.max(...config.courses.map(c => c.id)) : -1;
    const newId = maxId + 1;
    const newCourse: Course = {
      id: newId,
      title: newCourseTitle.trim(),
      description: newCourseDesc.trim(),
      image: 'lesson-0',
      concepts: [
        {
          id: `concept-${newId}-0`,
          title: newCourseTitle.trim(),
          topics: [
            { id: newId, title: newCourseTitle.trim(), description: newCourseDesc.trim(), implemented: false },
          ],
        },
      ],
    };
    const courses = [...config.courses, newCourse];
    let sections = config.sections;
    if (newCourseSection) {
      sections = sections.map(s =>
        s.id === newCourseSection ? { ...s, courses: [...s.courses, newId] } : s
      );
    }
    setConfig({ ...config, courses, sections });
    setNewCourseTitle('');
    setNewCourseDesc('');
    setNewCourseSection('');
    setShowNewCourse(false);
  };

  const removeCourse = (courseId: number) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!window.confirm(`Delete course "${course?.title}"? This removes it from all sections.`)) return;
    setConfig({
      ...config,
      courses: config.courses.filter(c => c.id !== courseId),
      sections: config.sections.map(s => ({ ...s, courses: s.courses.filter(id => id !== courseId) })),
    });
  };

  const moveCourseInSection = (sectionId: string, idx: number, direction: -1 | 1) => {
    if (!config) return;
    const newIdx = idx + direction;
    setConfig({
      ...config,
      sections: config.sections.map(s => {
        if (s.id !== sectionId) return s;
        if (newIdx < 0 || newIdx >= s.courses.length) return s;
        const courses = [...s.courses];
        [courses[idx], courses[newIdx]] = [courses[newIdx], courses[idx]];
        return { ...s, courses };
      }),
    });
  };

  const moveCourseToSection = (courseId: number, fromSectionId: string, toSectionId: string) => {
    if (!config || fromSectionId === toSectionId) return;
    setConfig({
      ...config,
      sections: config.sections.map(s => {
        if (s.id === fromSectionId) return { ...s, courses: s.courses.filter(id => id !== courseId) };
        if (s.id === toSectionId) return { ...s, courses: [...s.courses, courseId] };
        return s;
      }),
    });
  };

  // --- Concept operations ---
  const addConcept = (courseId: number) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!course) return;
    const newConcept: Concept = {
      id: `concept-${courseId}-${course.concepts.length}`,
      title: 'New Concept',
      topics: [],
    };
    updateCourse(courseId, { concepts: [...course.concepts, newConcept] });
  };

  const updateConcept = (courseId: number, conceptId: string, updates: Partial<Concept>) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!course) return;
    updateCourse(courseId, {
      concepts: course.concepts.map(c => c.id === conceptId ? { ...c, ...updates } : c),
    });
  };

  const removeConcept = (courseId: number, conceptId: string) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!course) return;
    updateCourse(courseId, { concepts: course.concepts.filter(c => c.id !== conceptId) });
  };

  // --- Topic operations ---
  const addTopic = (courseId: number, conceptId: string) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!course) return;
    const allTopicIds = config.courses.flatMap(c => c.concepts.flatMap(con => con.topics.map(t => t.id)));
    const maxTopicId = allTopicIds.length > 0 ? Math.max(...allTopicIds) : -1;
    const newTopic: Topic = {
      id: maxTopicId + 1,
      title: 'New Topic',
      description: '',
      implemented: false,
    };
    updateCourse(courseId, {
      concepts: course.concepts.map(c =>
        c.id === conceptId ? { ...c, topics: [...c.topics, newTopic] } : c
      ),
    });
  };

  const updateTopic = (courseId: number, conceptId: string, topicId: number, updates: Partial<Topic>) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!course) return;
    updateCourse(courseId, {
      concepts: course.concepts.map(c =>
        c.id === conceptId
          ? { ...c, topics: c.topics.map(t => t.id === topicId ? { ...t, ...updates } : t) }
          : c
      ),
    });
  };

  const removeTopic = (courseId: number, conceptId: string, topicId: number) => {
    if (!config) return;
    const course = getCourse(courseId);
    if (!course) return;
    updateCourse(courseId, {
      concepts: course.concepts.map(c =>
        c.id === conceptId ? { ...c, topics: c.topics.filter(t => t.id !== topicId) } : c
      ),
    });
  };

  // --- Toggle expand ---
  const toggleExpand = (courseId: number) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  // --- Drill into lesson editor ---
  const openLessonEditor = (courseId: number) => {
    setEditingCourseId(courseId);
    setContentView('lesson-editor');
  };

  // --- Unassigned courses ---
  const getUnassignedCourses = (): Course[] => {
    if (!config) return [];
    const assigned = new Set(config.sections.flatMap(s => s.courses));
    return config.courses.filter(c => !assigned.has(c.id));
  };

  // === LESSON EDITOR VIEW ===
  if (contentView === 'lesson-editor') {
    return (
      <LessonEditor
        initialCourseId={editingCourseId ?? undefined}
        onBack={() => { setContentView('overview'); setEditingCourseId(null); }}
      />
    );
  }

  // === OVERVIEW VIEW ===
  if (!config) {
    return <p className="text-[#9DA7B7]">Loading dashboard config...</p>;
  }

  const unassigned = getUnassignedCourses();

  return (
    <div>
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 font-inter text-lg font-semibold text-[#F9FAFB]">Dashboard Structure</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewSection(true)} className={actionBtnCls}>+ Section</button>
          <button onClick={() => setShowNewCourse(true)} className={actionBtnCls}>+ Course</button>
          <button onClick={() => { void handleSave(); }} disabled={saving} className={saveBtnCls}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`
          mb-3 rounded-md px-3.5 py-2 text-[13px]
          ${message.startsWith('Error') ? `bg-[#3b1a1a] text-error` : `
            bg-[#1a3b2a] text-success
          `}
        `}>
          {message}
        </div>
      )}

      {/* New section form */}
      {showNewSection && (
        <div className="
          mb-3 flex flex-wrap items-center gap-2 rounded-md border
          border-brand-card bg-brand-panel px-3.5 py-3
        ">
          <input
            value={newSectionTitle}
            onChange={e => setNewSectionTitle(e.target.value)}
            placeholder="Section title..."
            className={`
              ${inputCls}
              flex-1
            `}
            onKeyDown={e => e.key === 'Enter' && addSection()}
            autoFocus
          />
          <button onClick={addSection} className={saveBtnCls} disabled={!newSectionTitle.trim()}>Create</button>
          <button onClick={() => setShowNewSection(false)} className={cancelBtnCls}>Cancel</button>
        </div>
      )}

      {/* New course form */}
      {showNewCourse && (
        <div className="
          mb-3 flex flex-wrap items-center gap-2 rounded-md border
          border-brand-card bg-brand-panel px-3.5 py-3
        ">
          <input
            value={newCourseTitle}
            onChange={e => setNewCourseTitle(e.target.value)}
            placeholder="Course title..."
            className={`
              ${inputCls}
              flex-1
            `}
            autoFocus
          />
          <input
            value={newCourseDesc}
            onChange={e => setNewCourseDesc(e.target.value)}
            placeholder="Description..."
            className={`
              ${inputCls}
              flex-1
            `}
          />
          <select
            value={newCourseSection}
            onChange={e => setNewCourseSection(e.target.value)}
            className={`
              ${inputCls}
              w-40
            `}
          >
            <option value="">No section</option>
            {config.sections.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.title}</option>
            ))}
          </select>
          <button onClick={addCourse} className={saveBtnCls} disabled={!newCourseTitle.trim()}>Create</button>
          <button onClick={() => setShowNewCourse(false)} className={cancelBtnCls}>Cancel</button>
        </div>
      )}

      {/* Sections */}
      {config.sections.map((section, sIdx) => (
        <div key={section.id} className="
          mb-4 rounded-lg border border-brand-card bg-[#0d1a30] px-4 py-3.5
        ">
          {/* Section header */}
          <div className="mb-2.5 flex items-center justify-between gap-2">
            {editingSectionId === section.id ? (
              <input
                value={editingSectionTitle}
                onChange={e => setEditingSectionTitle(e.target.value)}
                onBlur={renameSectionSave}
                onKeyDown={e => e.key === 'Enter' && renameSectionSave()}
                className={`
                  ${inputCls}
                  flex-1 text-[15px] font-semibold
                `}
                autoFocus
              />
            ) : (
              <h4
                className="
                  m-0 cursor-pointer font-inter text-[15px] font-semibold
                  text-[#E5E7EB]
                "
                onDoubleClick={() => renameSectionStart(section)}
                title="Double-click to rename"
              >
                {section.title}
              </h4>
            )}
            <div className="flex items-center gap-1">
              <span className="mr-2 text-xs text-[#6B7280]">{section.courses.length} course(s)</span>
              <button onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0} className={iconBtnCls} title="Move up">&#9650;</button>
              <button onClick={() => moveSection(sIdx, 1)} disabled={sIdx === config.sections.length - 1} className={iconBtnCls} title="Move down">&#9660;</button>
              <button onClick={() => renameSectionStart(section)} className={iconBtnCls} title="Rename">&#9998;</button>
              <button onClick={() => removeSection(section.id)} className={`
                ${iconBtnCls}
                text-error
              `} title="Remove section">&#10005;</button>
            </div>
          </div>

          {/* Course cards in section */}
          {section.courses.length === 0 && (
            <p className="mt-2 text-[13px] text-[#6B7280] italic">No courses in this section. Add courses or move them here.</p>
          )}
          {section.courses.map((courseId, cIdx) => {
            const course = getCourse(courseId);
            if (!course) return (
              <div key={courseId} className="
                mb-1.5 rounded-md border border-brand-card bg-brand-panel px-3
                py-2.5
              ">
                <span className="text-error">Course {courseId} not found</span>
              </div>
            );
            const isExpanded = expandedCourses.has(courseId);
            const isEditing = editingCardId === courseId;

            return (
              <div key={courseId} className="
                mb-1.5 rounded-md border border-brand-card bg-brand-panel px-3
                py-2.5
              ">
                {/* Course card header */}
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleExpand(courseId)} className="
                    mt-0.5 cursor-pointer border-none bg-transparent px-1 py-0.5
                    font-inter text-sm text-[#9DA7B7]
                  ">
                    {isExpanded ? '▾' : '▸'}
                  </button>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5">
                        <input value={course.title} onChange={e => updateCourse(courseId, { title: e.target.value })} className={`
                          ${inputCls}
                          font-semibold
                        `} />
                        <input value={course.description} onChange={e => updateCourse(courseId, { description: e.target.value })} className={inputCls} placeholder="Description..." />
                        <select value={course.image} onChange={e => updateCourse(courseId, { image: e.target.value })} className={`
                          ${inputCls}
                          w-45
                        `}>
                          {IMAGE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button onClick={() => setEditingCardId(null)} className={`
                          ${cancelBtnCls}
                          self-start
                        `}>Done</button>
                      </div>
                    ) : (
                      <>
                        <span className="
                          block font-inter text-sm font-semibold text-[#E5E7EB]
                        ">{course.title}</span>
                        <span className="
                          mt-0.5 block font-inter text-xs text-[#6B7280]
                        ">{course.description}</span>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => moveCourseInSection(section.id, cIdx, -1)} disabled={cIdx === 0} className={iconBtnCls} title="Move up">&#9650;</button>
                    <button onClick={() => moveCourseInSection(section.id, cIdx, 1)} disabled={cIdx === section.courses.length - 1} className={iconBtnCls} title="Move down">&#9660;</button>
                    <select
                      value={section.id}
                      onChange={e => moveCourseToSection(courseId, section.id, e.target.value)}
                      className={`
                        ${inputCls}
                        w-30 px-1 py-0.5 text-[11px]
                      `}
                      title="Move to section"
                    >
                      {config.sections.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.title}</option>
                      ))}
                    </select>
                    <button onClick={() => setEditingCardId(isEditing ? null : courseId)} className={iconBtnCls} title="Edit card">&#9998;</button>
                    <button onClick={() => openLessonEditor(courseId)} className={editContentBtnCls} title="Edit lesson content">Content</button>
                    <button onClick={() => removeCourse(courseId)} className={`
                      ${iconBtnCls}
                      text-error
                    `} title="Delete course">&#10005;</button>
                  </div>
                </div>

                {/* Expanded: concepts & topics */}
                {isExpanded && (
                  <div className="mt-2.5 ml-5 border-l-2 border-brand-card pl-3">
                    {course.concepts.map(concept => (
                      <div key={concept.id} className="
                        mb-2 rounded-sm border border-[#1e2d4a] bg-[#0d1a30]
                        px-2.5 py-2
                      ">
                        <div className="mb-1.5 flex items-center gap-2">
                          <input
                            value={concept.title}
                            onChange={e => updateConcept(courseId, concept.id, { title: e.target.value })}
                            className={`
                              ${inputCls}
                              flex-1 text-[13px] font-medium
                            `}
                            placeholder="Concept title..."
                          />
                          <button onClick={() => removeConcept(courseId, concept.id)} className={`
                            ${iconBtnCls}
                            text-error
                          `} title="Remove concept">&#10005;</button>
                        </div>
                        {concept.topics.map(topic => (
                          <div key={topic.id} className="
                            mb-1 flex items-center gap-1.5 pl-1
                          ">
                            <label className="
                              flex shrink-0 cursor-pointer items-center
                            " title="Is this topic implemented?">
                              <input
                                type="checkbox"
                                checked={topic.implemented}
                                onChange={e => updateTopic(courseId, concept.id, topic.id, { implemented: e.target.checked })}
                              />
                            </label>
                            <input
                              value={topic.title}
                              onChange={e => updateTopic(courseId, concept.id, topic.id, { title: e.target.value })}
                              className={`
                                ${inputCls}
                                flex-1 text-xs
                              `}
                              placeholder="Topic title..."
                            />
                            <input
                              value={topic.description}
                              onChange={e => updateTopic(courseId, concept.id, topic.id, { description: e.target.value })}
                              className={`
                                ${inputCls}
                                flex-1 text-xs
                              `}
                              placeholder="Description..."
                            />
                            <span className="
                              shrink-0 rounded-sm bg-[#0d1a30] px-1.5 py-0.5
                              font-inter text-[10px] whitespace-nowrap
                              text-[#6B7280]
                            ">ID: {topic.id}</span>
                            <button onClick={() => openLessonEditor(topic.id)} className={editContentBtnCls} title="Edit this topic's lesson content">Edit</button>
                            <button onClick={() => removeTopic(courseId, concept.id, topic.id)} className={`
                              ${iconBtnCls}
                              text-error
                            `}>&#10005;</button>
                          </div>
                        ))}
                        <button onClick={() => addTopic(courseId, concept.id)} className={addBtnCls}>+ Topic</button>
                      </div>
                    ))}
                    <button onClick={() => addConcept(courseId)} className={addBtnCls}>+ Concept</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Unassigned courses */}
      {unassigned.length > 0 && (
        <div className="
          mb-4 rounded-lg border border-[#5f4e1e] bg-[#0d1a30] px-4 py-3.5
        ">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h4 className="
              m-0 font-inter text-[15px] font-semibold text-[#f5c542]
            ">Unassigned Courses</h4>
            <span className="text-xs text-[#6B7280]">{unassigned.length} course(s) not in any section</span>
          </div>
          {unassigned.map(course => (
            <div key={course.id} className="
              mb-1.5 rounded-md border border-brand-card bg-brand-panel px-3
              py-2.5
            ">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <span className="
                    block font-inter text-sm font-semibold text-[#E5E7EB]
                  ">{course.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <select
                    value=""
                    onChange={e => {
                      if (!e.target.value) return;
                      setConfig({
                        ...config,
                        sections: config.sections.map(sec =>
                          sec.id === e.target.value ? { ...sec, courses: [...sec.courses, course.id] } : sec
                        ),
                      });
                    }}
                    className={`
                      ${inputCls}
                      w-35 text-[11px]
                    `}
                  >
                    <option value="">Assign to section...</option>
                    {config.sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.title}</option>
                    ))}
                  </select>
                  <button onClick={() => removeCourse(course.id)} className={`
                    ${iconBtnCls}
                    text-error
                  `}>&#10005;</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {config.sections.length === 0 && unassigned.length === 0 && (
        <p className="mt-2 text-[13px] text-[#6B7280] italic">No sections or courses yet. Use the buttons above to get started.</p>
      )}
    </div>
  );
};

export default ContentManager;
