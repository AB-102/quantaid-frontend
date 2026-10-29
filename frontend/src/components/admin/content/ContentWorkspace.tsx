// src/components/admin/content/ContentWorkspace.tsx
// The admin Content tab: an outline of the dashboard on the left, the selected item on the right.
// Edits to the outline and to the open lesson stay local until Save (Ctrl+S), which saves whichever changed.

import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/api';
import type { DashboardConfig } from '@/types/course';
import type { ContentBlock } from '@/types/lesson';
import type { Question } from '@/types/quiz';
import ContentOutline from './ContentOutline';
import LessonEditor from './LessonEditor';
import { lessonToSource, sourceToLesson } from './lessonSource';
import { ConceptPanel, CoursePanel, type PanelProps, SectionPanel, TopicFields } from './Panels';
import RowMenu from './RowMenu';
import {
  addSection, addTopic, allTopics, findTopic, removeConcept, removeCourse, removeSection, removeTopic,
  type Selection, sectionOfCourse, updateTopic,
} from './structure';
import { dangerBtnCls, hintCls, inputCls, labelCls, panelTitleCls, primaryBtnCls, secondaryBtnCls } from './styles';

interface LessonSummary {
  courseId: number;
  title: string;
}

interface Lesson {
  courseId: number;
  title: string;
  blocks: ContentBlock[];
  quiz: Question[];
  interactiveTerms?: Record<string, string>;
}

// The open lesson. `exists` is false for a topic whose lesson hasn't been saved yet.
interface LessonDraft {
  lessonId: number;
  exists: boolean;
  title: string;
  source: string;
  savedTitle: string;
  savedSource: string;
}

interface Toast {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

const errorDetail = (err: unknown, fallback: string): string =>
  axios.isAxiosError<{ detail?: unknown }>(err) && typeof err.response?.data.detail === 'string' ? err.response.data.detail : fallback;

const lessonIdOf = (selection: Selection | null): number | null => {
  if (selection?.kind === 'topic') return selection.topicId;
  if (selection?.kind === 'lesson') return selection.lessonId;
  return null;
};

const ContentWorkspace: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<DashboardConfig | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [draft, setDraft] = useState<LessonDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const draftRequest = useRef(0);

  const notify = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, kind, text }]);
    if (kind === 'success') setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    Promise.all([api.get<DashboardConfig>('/admin/dashboard-config'), api.get<LessonSummary[]>('/lessons')])
      .then(([configRes, lessonsRes]) => {
        const loaded = { sections: configRes.data.sections, courses: configRes.data.courses };
        setConfig(loaded);
        setSavedConfig(loaded);
        setLessons(lessonsRes.data.map(l => ({ courseId: l.courseId, title: l.title })));
      })
      .catch(() => setLoadError(true));
  }, []);

  const configDirty = config !== null && JSON.stringify(config) !== JSON.stringify(savedConfig);
  const lessonDirty = draft !== null && (draft.title !== draft.savedTitle || draft.source !== draft.savedSource);
  const dirty = configDirty || lessonDirty;

  const lessonIds = new Set(lessons.map(l => l.courseId));
  const topicIds = new Set(config ? allTopics(config).map(t => t.id) : []);
  const orphanLessons = lessons.filter(l => !topicIds.has(l.courseId));

  const confirmDiscardLesson = (): boolean =>
    !lessonDirty || window.confirm(`Discard your unsaved changes to the lesson “${draft.title || 'Untitled'}”?`);

  const openLesson = (lessonId: number, fallbackTitle: string) => {
    const request = ++draftRequest.current;
    setDraft(null);
    setDraftLoading(true);
    api.get<Lesson>(`/lessons/${lessonId}`)
      .then(res => {
        if (request !== draftRequest.current) return;
        const source = lessonToSource({ blocks: res.data.blocks, quiz: res.data.quiz, interactiveTerms: res.data.interactiveTerms ?? {} });
        setDraft({ lessonId, exists: true, title: res.data.title, source, savedTitle: res.data.title, savedSource: source });
      })
      .catch((err: unknown) => {
        if (request !== draftRequest.current) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setDraft({ lessonId, exists: false, title: fallbackTitle, source: '', savedTitle: fallbackTitle, savedSource: '' });
        } else {
          notify('error', "Couldn't load the lesson.");
        }
      })
      .finally(() => { if (request === draftRequest.current) setDraftLoading(false); });
  };

  const select = (next: Selection | null) => {
    const nextLessonId = lessonIdOf(next);
    if (nextLessonId !== draft?.lessonId && !confirmDiscardLesson()) return;
    setSelection(next);
    if (nextLessonId === null) {
      draftRequest.current++;
      setDraft(null);
    } else if (nextLessonId !== draft?.lessonId && config) {
      const title = findTopic(config, nextLessonId)?.topic.title ?? lessons.find(l => l.courseId === nextLessonId)?.title ?? '';
      openLesson(nextLessonId, title);
    }
  };

  // --- Saving ---

  const save = async () => {
    if (saving || !config || !dirty) return;
    setSaving(true);
    const saved: string[] = [];
    try {
      if (configDirty) {
        await api.put('/admin/dashboard-config', { sections: config.sections, courses: config.courses });
        setSavedConfig(config);
        saved.push('the outline');
      }
      if (lessonDirty) {
        const parsed = sourceToLesson(draft.source);
        const title = draft.title.trim();
        if (!title) {
          notify('error', 'The lesson needs a title before it can be saved.');
        } else if (parsed.problems.length > 0) {
          notify('error', `The lesson wasn't saved: fix the ${parsed.problems.length} problem${parsed.problems.length === 1 ? '' : 's'} listed under the editor.`);
        } else {
          const body = { title, blocks: parsed.blocks, quiz: parsed.quiz, interactiveTerms: parsed.interactiveTerms };
          if (draft.exists) await api.patch(`/admin/lessons/${draft.lessonId}`, body);
          else await api.post('/admin/lessons', { courseId: draft.lessonId, ...body });
          setDraft({ ...draft, exists: true, savedTitle: draft.title, savedSource: draft.source });
          setLessons(prev => [...prev.filter(l => l.courseId !== draft.lessonId), { courseId: draft.lessonId, title }].sort((a, b) => a.courseId - b.courseId));
          setVersion(v => v + 1);
          saved.push('the lesson');
        }
      }
      if (saved.length > 0) notify('success', `Saved ${saved.join(' and ')}.`);
    } catch (err) {
      notify('error', `Save failed: ${errorDetail(err, 'the server didn’t accept the change')}`);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!savedConfig || !window.confirm('Discard all unsaved changes?')) return;
    setConfig(savedConfig);
    if (draft) setDraft({ ...draft, title: draft.savedTitle, source: draft.savedSource });
    if (selection && !stillExists(savedConfig, selection)) setSelection(null);
  };

  // Ctrl+S / Cmd+S saves from anywhere in the workspace, including the lesson editor
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Leaving the page with unsaved changes asks first
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // --- Deleting (structure only; lessons stay unless deleted for good from "Lessons not on the dashboard") ---

  const remove = (target: Selection) => {
    if (!config) return;
    let next = config;
    if (target.kind === 'section') {
      const section = config.sections.find(s => s.id === target.sectionId);
      if (!section || !window.confirm(`Delete the section “${section.title}”? Its courses move to “Courses not on the dashboard”.`)) return;
      next = removeSection(config, target.sectionId);
    } else if (target.kind === 'course') {
      const course = config.courses.find(c => c.id === target.courseId);
      if (!course || !window.confirm(`Delete the course “${course.title}”? Its topics' lessons are kept, under “Lessons not on the dashboard”.`)) return;
      next = removeCourse(config, target.courseId);
    } else if (target.kind === 'concept') {
      const concept = config.courses.find(c => c.id === target.courseId)?.concepts.find(c => c.id === target.conceptId);
      if (!concept || !window.confirm(`Remove the concept “${concept.title}”? Its topics' lessons are kept, under “Lessons not on the dashboard”.`)) return;
      next = removeConcept(config, target.courseId, target.conceptId);
    } else if (target.kind === 'topic') {
      const found = findTopic(config, target.topicId);
      if (!found || !window.confirm(`Remove the topic “${found.topic.title}” from the dashboard? Its lesson is kept, under “Lessons not on the dashboard”.`)) return;
      next = removeTopic(config, target.courseId, target.conceptId, target.topicId);
    }
    setConfig(next);
    // An open lesson whose topic is gone stays open, as a lesson off the dashboard; anything else that's gone closes
    if (selection && !stillExists(next, selection)) {
      if (draft && (draft.exists || lessonDirty)) setSelection({ kind: 'lesson', lessonId: draft.lessonId });
      else select(null);
    }
  };

  const deleteLessonForGood = async (lessonId: number) => {
    const title = lessons.find(l => l.courseId === lessonId)?.title ?? `#${lessonId}`;
    if (!window.confirm(`Delete the lesson “${title}” for good? Students' quiz results for it stay, and its last version is kept in the database.`)) return;
    try {
      await api.delete(`/admin/lessons/${lessonId}`);
      setLessons(prev => prev.filter(l => l.courseId !== lessonId));
      draftRequest.current++;
      setDraft(null);
      setSelection(null);
      notify('success', `Deleted “${title}”.`);
    } catch (err) {
      notify('error', `Delete failed: ${errorDetail(err, 'the server didn’t accept it')}`);
    }
  };

  const downloadAll = async () => {
    try {
      const res = await api.get('/admin/lessons/export');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }));
      link.download = 'lessons_export.json';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      notify('error', 'The download failed.');
    }
  };

  if (loadError) return <p className="text-error">Couldn&apos;t load the content. Reload the page to try again.</p>;
  if (!config) return <p className="text-[#9DA7B7]">Loading content…</p>;

  const panelProps: PanelProps = { config, lessonIds, onChange: setConfig, onSelect: select, onDelete: remove };

  const lessonEditor = draftLoading ? <p className="text-[#9DA7B7]">Loading lesson…</p> : draft && (
    <LessonEditor
      key={draft.lessonId}
      lessonId={draft.lessonId}
      exists={draft.exists}
      title={draft.title}
      source={draft.source}
      version={version}
      onChange={changes => setDraft(prev => (prev ? { ...prev, ...changes } : prev))}
      notify={notify}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header: where you are, and whether anything needs saving */}
      <div className="
        sticky top-0 z-20 -mx-8 flex flex-wrap items-center gap-3 border-b
        border-brand-border-dark bg-[#0f1729]/95 px-8 py-3 backdrop-blur-sm
      ">
        <Breadcrumbs config={config} selection={selection} lessons={lessons} onSelect={select} />
        <span className="flex-1" />
        {dirty ? (
          <span className="text-[13px] text-[#f5c542]" aria-live="polite">● Unsaved changes</span>
        ) : (
          <span className="text-[13px] text-[#6B7280]" aria-live="polite">All changes saved</span>
        )}
        <button onClick={discard} disabled={!dirty || saving} className={secondaryBtnCls}>Discard</button>
        <button onClick={() => { void save(); }} disabled={!dirty || saving} className={primaryBtnCls} title="Ctrl+S">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <RowMenu label="content" actions={[{ label: 'Download all lessons (JSON)', onSelect: () => { void downloadAll(); } }]} />
      </div>

      <div className="
        grid items-start gap-6
        lg:grid-cols-[300px_minmax(0,1fr)]
      ">
        <aside className="
          lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto
          lg:pr-1
        ">
          <ContentOutline
            config={config}
            lessonIds={lessonIds}
            orphanLessons={orphanLessons}
            selection={selection}
            onSelect={select}
            onChange={setConfig}
            onDelete={remove}
            onAddSection={() => {
              const { config: next, section } = addSection(config);
              setConfig(next);
              select({ kind: 'section', sectionId: section.id });
            }}
          />
        </aside>

        <main aria-label="Selected item" className="min-w-0">
          <SelectedPanel
            selection={selection}
            panelProps={panelProps}
            orphanLessons={orphanLessons}
            lessonEditor={lessonEditor}
            onDeleteLesson={id => { void deleteLessonForGood(id); }}
          />
        </main>
      </div>

      <div className="fixed right-6 bottom-6 z-3000 flex w-96 flex-col gap-2" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} role={toast.kind === 'error' ? 'alert' : 'status'} className={`
            flex items-start gap-3 rounded-md border px-4 py-3 text-[13px]
            shadow-xl
            ${toast.kind === 'error' ? `
              border-[#7f1d1d] bg-[#3b1a1a] text-[#fecaca]
            ` : `border-[#166534] bg-[#1a3b2a] text-[#bbf7d0]`}
          `}>
            <span className="flex-1">{toast.text}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              aria-label="Dismiss"
              className="
                cursor-pointer border-none bg-transparent p-0 text-base
                leading-none text-inherit
              "
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const findConcept = (config: DashboardConfig, courseId: number, conceptId: string) =>
  config.courses.find(c => c.id === courseId)?.concepts.find(c => c.id === conceptId);

// Whether the selected section, course, concept or topic is still in the config (a lesson always is)
function stillExists(config: DashboardConfig, selection: Selection): boolean {
  switch (selection.kind) {
    case 'section': return config.sections.some(s => s.id === selection.sectionId);
    case 'course': return config.courses.some(c => c.id === selection.courseId);
    case 'concept': return findConcept(config, selection.courseId, selection.conceptId) !== undefined;
    case 'topic': return findConcept(config, selection.courseId, selection.conceptId)?.topics.some(t => t.id === selection.topicId) === true;
    case 'lesson': return true;
  }
}

const Breadcrumbs: React.FC<{
  config: DashboardConfig;
  selection: Selection | null;
  lessons: LessonSummary[];
  onSelect: (selection: Selection) => void;
}> = ({ config, selection, lessons, onSelect }) => {
  const crumbs: { label: string; target: Selection }[] = [];
  if (selection?.kind === 'section') {
    const section = config.sections.find(s => s.id === selection.sectionId);
    if (section) crumbs.push({ label: section.title, target: selection });
  } else if (selection?.kind === 'lesson') {
    crumbs.push({ label: lessons.find(l => l.courseId === selection.lessonId)?.title ?? 'Lesson', target: selection });
  } else if (selection) {
    const course = config.courses.find(c => c.id === selection.courseId);
    const section = sectionOfCourse(config, selection.courseId);
    if (section) crumbs.push({ label: section.title, target: { kind: 'section', sectionId: section.id } });
    if (course) crumbs.push({ label: course.title, target: { kind: 'course', courseId: course.id } });
    if (course && selection.kind !== 'course') {
      const concept = course.concepts.find(c => c.id === selection.conceptId);
      if (concept) crumbs.push({ label: concept.title, target: { kind: 'concept', courseId: course.id, conceptId: concept.id } });
      const topic = selection.kind === 'topic' ? concept?.topics.find(t => t.id === selection.topicId) : undefined;
      if (topic) crumbs.push({ label: topic.title, target: selection });
    }
  }
  return (
    <nav aria-label="Breadcrumb" className="
      flex min-w-0 flex-wrap items-center gap-1 text-[13px]
    ">
      <span className="font-semibold text-[#F9FAFB]">Content</span>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          <span className="text-[#6B7280]">›</span>
          <button
            onClick={() => onSelect(crumb.target)}
            className="
              cursor-pointer truncate border-none bg-transparent p-0 text-[13px]
              text-[#C9D1DC]
              hover:underline
            "
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

const SelectedPanel: React.FC<{
  selection: Selection | null;
  panelProps: PanelProps;
  orphanLessons: LessonSummary[];
  lessonEditor: React.ReactNode;
  onDeleteLesson: (lessonId: number) => void;
}> = ({ selection, panelProps, orphanLessons, lessonEditor, onDeleteLesson }) => {
  const { config } = panelProps;

  if (selection?.kind === 'section') {
    const section = config.sections.find(s => s.id === selection.sectionId);
    if (section) return <SectionPanel {...panelProps} section={section} />;
  }
  if (selection?.kind === 'course') {
    const course = config.courses.find(c => c.id === selection.courseId);
    if (course) return <CoursePanel {...panelProps} course={course} />;
  }
  if (selection?.kind === 'concept' || selection?.kind === 'topic') {
    const course = config.courses.find(c => c.id === selection.courseId);
    const concept = course?.concepts.find(c => c.id === selection.conceptId);
    if (course && concept && selection.kind === 'concept') return <ConceptPanel {...panelProps} course={course} concept={concept} />;
    const topic = selection.kind === 'topic' ? concept?.topics.find(t => t.id === selection.topicId) : undefined;
    if (course && concept && topic) {
      return (
        <div>
          <TopicFields {...panelProps} course={course} concept={concept} topic={topic} />
          {lessonEditor}
          <div className="mt-8 border-t border-brand-border-dark pt-4">
            <p className={`
              ${hintCls}
              mt-0 mb-2
            `}>Removing the topic takes it off the dashboard. Its lesson is kept, under “Lessons not on the dashboard”.</p>
            <button onClick={() => panelProps.onDelete(selection)} className={dangerBtnCls}>Remove topic</button>
          </div>
        </div>
      );
    }
  }
  if (selection?.kind === 'lesson') {
    return <OrphanLessonPanel {...panelProps} lessonId={selection.lessonId} title={orphanLessons.find(l => l.courseId === selection.lessonId)?.title ?? ''} lessonEditor={lessonEditor} onDeleteLesson={onDeleteLesson} />;
  }

  return (
    <div className="max-w-xl">
      <h2 className={panelTitleCls}>Content</h2>
      <p className="text-[13px] leading-relaxed text-[#AAB4C8]">
        Choose a section, course, concept or topic in the outline to edit it. Topics are lessons: open one to write
        it in Markdown with TeX math ($…$), see exactly what students will see, and link its quiz questions to the
        content they review.
      </p>
      <p className="text-[13px] leading-relaxed text-[#AAB4C8]">
        To revise a lesson with an AI assistant, open it, use <b>Copy for AI</b>, and paste the assistant&apos;s reply
        back with <b>Paste from AI</b>. Every save keeps the version it replaces in the lesson&apos;s History.
      </p>
    </div>
  );
};

// A lesson no topic points at: put it back on the dashboard, edit it, or delete it for good
const OrphanLessonPanel: React.FC<PanelProps & {
  lessonId: number;
  title: string;
  lessonEditor: React.ReactNode;
  onDeleteLesson: (lessonId: number) => void;
}> = ({ config, lessonIds, onChange, onSelect, lessonId, title, lessonEditor, onDeleteLesson }) => {
  const concepts = config.courses.flatMap(course => course.concepts.map(concept => ({ course, concept })));
  const [target, setTarget] = useState(concepts.length > 0 ? `${concepts[0].course.id}|${concepts[0].concept.id}` : '');

  const attach = () => {
    const found = concepts.find(({ course, concept }) => `${course.id}|${concept.id}` === target);
    if (!found) return;
    const { config: added, topic } = addTopic(config, found.course.id, found.concept.id, lessonIds, lessonId);
    onChange(updateTopic(added, found.course.id, found.concept.id, topic.id, { title: title || topic.title }));
    onSelect({ kind: 'topic', courseId: found.course.id, conceptId: found.concept.id, topicId: topic.id });
  };

  return (
    <div>
      <h2 className={panelTitleCls}>Lesson not on the dashboard</h2>
      <p className={`
        ${hintCls}
        mt-0 mb-5
      `}>No topic points at this lesson, so students can&apos;t reach it. Students&apos; quiz results for it are kept.</p>
      <div className="mb-6 flex flex-wrap items-end gap-2">
        <div className="min-w-72 flex-1">
          <label htmlFor="orphan-target" className={labelCls}>Add it as a topic to</label>
          <select id="orphan-target" value={target} onChange={e => setTarget(e.target.value)} className={inputCls}>
            {concepts.map(({ course, concept }) => (
              <option key={`${course.id}|${concept.id}`} value={`${course.id}|${concept.id}`}>{course.title} › {concept.title}</option>
            ))}
          </select>
        </div>
        <button onClick={attach} disabled={!target} className={secondaryBtnCls}>Add to the dashboard</button>
      </div>
      {lessonEditor}
      <div className="mt-8 border-t border-brand-border-dark pt-4">
        <button onClick={() => onDeleteLesson(lessonId)} className={dangerBtnCls}>Delete lesson for good</button>
      </div>
    </div>
  );
};

export default ContentWorkspace;
