// The panel beside the outline for whatever is selected: labelled fields, and the item's children with a way to add one

import React from 'react';
import CourseCard from '@/components/dashboard/CourseCard';
import { COURSE_IMAGES, courseImageSrc } from '@/constants/courseImages';
import type { Concept, Course, DashboardConfig, DashboardSection, Topic } from '@/types/course';
import {
  addConcept, addCourse, addTopic, type Selection, sectionOfCourse, setCourseSection, topicStatus,
  updateConcept, updateCourse, updateSection, updateTopic,
} from './structure';
import { dangerBtnCls, hintCls, inputCls, labelCls, panelTitleCls, secondaryBtnCls } from './styles';

export interface PanelProps {
  config: DashboardConfig;
  lessonIds: Set<number>;
  onChange: (config: DashboardConfig) => void;
  onSelect: (selection: Selection) => void;
  onDelete: (selection: Selection) => void;
}

const Field: React.FC<{ id: string; label: string; hint?: string; children: React.ReactNode }> = ({ id, label, hint, children }) => (
  <div className="mb-4">
    <label htmlFor={id} className={labelCls}>{label}</label>
    {children}
    {hint && <p className={hintCls}>{hint}</p>}
  </div>
);

const ChildList: React.FC<{ title: string; empty: string; children: React.ReactNode; onAdd: () => void; addLabel: string }> = ({ title, empty, children, onAdd, addLabel }) => {
  const items = React.Children.toArray(children);
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-[13px] font-semibold text-[#C9D1DC]">{title}</h3>
      {items.length === 0 ? <p className="m-0 mb-2 text-[13px] text-[#6B7280]">{empty}</p> : (
        <ul className="m-0 mb-2 list-none space-y-1 p-0">{items}</ul>
      )}
      <button onClick={onAdd} className={secondaryBtnCls}>{addLabel}</button>
    </div>
  );
};

const ChildRow: React.FC<{ label: string; detail?: string; onOpen: () => void }> = ({ label, detail, onOpen }) => (
  <li>
    <button
      onClick={onOpen}
      className="
        flex w-full cursor-pointer items-center justify-between gap-3 rounded-md
        border border-brand-border-dark bg-transparent px-3 py-2 text-left
        font-inter text-[13px] text-[#E5E7EB]
        hover:bg-white/5
      "
    >
      <span className="truncate">{label}</span>
      {detail && <span className="shrink-0 text-xs text-[#8A94A6]">{detail}</span>}
    </button>
  </li>
);

const DangerZone: React.FC<{ description: string; label: string; onDelete: () => void }> = ({ description, label, onDelete }) => (
  <div className="mt-8 border-t border-brand-border-dark pt-4">
    <p className={`
      ${hintCls}
      mt-0 mb-2
    `}>{description}</p>
    <button onClick={onDelete} className={dangerBtnCls}>{label}</button>
  </div>
);

const STATUS_TEXT = { 'published': 'Published', 'coming-soon': 'Coming soon', 'no-lesson': 'No lesson yet' };

// --- Section ---

export const SectionPanel: React.FC<PanelProps & { section: DashboardSection }> = ({ section, config, onChange, onSelect, onDelete }) => (
  <div>
    <h2 className={panelTitleCls}>Section</h2>
    <p className={`
      ${hintCls}
      mt-0 mb-5
    `}>A row of course cards on the student dashboard.</p>
    <Field id="section-title" label="Title">
      <input id="section-title" value={section.title} onChange={e => onChange(updateSection(config, section.id, { title: e.target.value }))} className={inputCls} />
    </Field>
    <ChildList
      title="Courses, in order"
      empty="No courses in this section yet."
      addLabel="+ Add a course"
      onAdd={() => { const { config: next, course } = addCourse(config, section.id); onChange(next); onSelect({ kind: 'course', courseId: course.id }); }}
    >
      {section.courses.map(id => config.courses.find(c => c.id === id)).filter((c): c is Course => c !== undefined).map(course => (
        <ChildRow key={course.id} label={course.title} onOpen={() => onSelect({ kind: 'course', courseId: course.id })} />
      ))}
    </ChildList>
    <DangerZone
      description="Deleting the section keeps its courses; they move to “Courses not on the dashboard”."
      label="Delete section"
      onDelete={() => onDelete({ kind: 'section', sectionId: section.id })}
    />
  </div>
);

// --- Course ---

export const CoursePanel: React.FC<PanelProps & { course: Course }> = ({ course, config, lessonIds, onChange, onSelect, onDelete }) => {
  const section = sectionOfCourse(config, course.id);
  const topicCount = course.concepts.reduce((n, c) => n + c.topics.length, 0);
  return (
    <div>
      <h2 className={panelTitleCls}>Course</h2>
      <p className={`
        ${hintCls}
        mt-0 mb-5
      `}>A card on the student dashboard. Students open courses in order, after finishing the one before.</p>
      <div className="flex flex-wrap gap-8">
        <div className="min-w-72 flex-1">
          <Field id="course-title" label="Title">
            <input id="course-title" value={course.title} onChange={e => onChange(updateCourse(config, course.id, { title: e.target.value }))} className={inputCls} />
          </Field>
          <Field id="course-description" label="Description" hint="Shown on the card, under the title.">
            <textarea id="course-description" rows={3} value={course.description} onChange={e => onChange(updateCourse(config, course.id, { description: e.target.value }))} className={`
              ${inputCls}
              resize-y
            `} />
          </Field>
          <fieldset className="mb-4 border-none p-0">
            <legend className={labelCls}>Card picture</legend>
            <div className="flex gap-2">
              {COURSE_IMAGES.map(image => (
                <label key={image.key} className={`
                  cursor-pointer rounded-md border-2 p-1
                  ${course.image === image.key ? 'border-brand-sky' : `
                    border-transparent
                  `}
                `}>
                  <input type="radio" name="course-image" className="sr-only" checked={course.image === image.key} onChange={() => onChange(updateCourse(config, course.id, { image: image.key }))} />
                  <img src={image.src} alt={image.label} className="
                    block h-14 w-20 object-contain
                  " />
                </label>
              ))}
            </div>
          </fieldset>
          <Field id="course-section" label="Section">
            <select
              id="course-section"
              value={section?.id ?? ''}
              onChange={e => onChange(setCourseSection(config, course.id, e.target.value || null))}
              className={inputCls}
            >
              <option value="">Not on the dashboard</option>
              {config.sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </Field>
        </div>
        <div>
          <p className={labelCls}>Card preview</p>
          <CourseCard course={{ ...course, image: courseImageSrc(course.image) }} isUnlocked progress={0} onSelect={() => {}} cardRef={() => {}} />
        </div>
      </div>
      <ChildList
        title="Concepts"
        empty="No concepts yet. Concepts group the course's topics."
        addLabel="+ Add a concept"
        onAdd={() => { const { config: next, concept } = addConcept(config, course.id); onChange(next); onSelect({ kind: 'concept', courseId: course.id, conceptId: concept.id }); }}
      >
        {course.concepts.map(concept => (
          <ChildRow
            key={concept.id}
            label={concept.title}
            detail={`${concept.topics.filter(t => topicStatus(t, lessonIds) === 'published').length}/${concept.topics.length} published`}
            onOpen={() => onSelect({ kind: 'concept', courseId: course.id, conceptId: concept.id })}
          />
        ))}
      </ChildList>
      <DangerZone
        description={`Deleting the course removes it and its ${topicCount} topic${topicCount === 1 ? '' : 's'} from the dashboard. Their lessons are kept, under “Lessons not on the dashboard”.`}
        label="Delete course"
        onDelete={() => onDelete({ kind: 'course', courseId: course.id })}
      />
    </div>
  );
};

// --- Concept ---

export const ConceptPanel: React.FC<PanelProps & { course: Course; concept: Concept }> = ({ course, concept, config, lessonIds, onChange, onSelect, onDelete }) => (
  <div>
    <h2 className={panelTitleCls}>Concept</h2>
    <p className={`
      ${hintCls}
      mt-0 mb-5
    `}>A group of topics on the page of {course.title}.</p>
    <Field id="concept-title" label="Title">
      <input id="concept-title" value={concept.title} onChange={e => onChange(updateConcept(config, course.id, concept.id, { title: e.target.value }))} className={inputCls} />
    </Field>
    <ChildList
      title="Topics, in order"
      empty="No topics yet. Each topic is a lesson with its own quiz."
      addLabel="+ Add a topic"
      onAdd={() => {
        const { config: next, topic } = addTopic(config, course.id, concept.id, lessonIds);
        onChange(next);
        onSelect({ kind: 'topic', courseId: course.id, conceptId: concept.id, topicId: topic.id });
      }}
    >
      {concept.topics.map(topic => (
        <ChildRow
          key={topic.id}
          label={topic.title}
          detail={STATUS_TEXT[topicStatus(topic, lessonIds)]}
          onOpen={() => onSelect({ kind: 'topic', courseId: course.id, conceptId: concept.id, topicId: topic.id })}
        />
      ))}
    </ChildList>
    <DangerZone
      description="Removing the concept takes its topics off the dashboard. Their lessons are kept, under “Lessons not on the dashboard”."
      label="Remove concept"
      onDelete={() => onDelete({ kind: 'concept', courseId: course.id, conceptId: concept.id })}
    />
  </div>
);

// --- Topic (its lesson editor sits below these fields) ---

export const TopicFields: React.FC<PanelProps & { course: Course; concept: Concept; topic: Topic }> = ({ course, concept, topic, config, lessonIds, onChange }) => {
  const set = (changes: Partial<Topic>) => onChange(updateTopic(config, course.id, concept.id, topic.id, changes));
  const published = topic.implemented ?? true;
  return (
    <div className="mb-6">
      <h2 className={panelTitleCls}>Topic</h2>
      <p className={`
        ${hintCls}
        mt-0 mb-5
      `}>A lesson in {course.title} › {concept.title}, with its own quiz.</p>
      <div className="
        grid gap-x-6
        lg:grid-cols-2
      ">
        <Field id="topic-title" label="Title" hint="Shown in the course page's topic list.">
          <input id="topic-title" value={topic.title} onChange={e => set({ title: e.target.value })} className={inputCls} />
        </Field>
        <Field id="topic-description" label="Description">
          <input id="topic-description" value={topic.description ?? ''} onChange={e => set({ description: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <fieldset className="border-none p-0">
        <legend className={labelCls}>Students</legend>
        <div className="flex flex-wrap gap-4 text-[13px]">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="topic-status" checked={published} onChange={() => set({ implemented: true })} />
            Published: students can open it
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="topic-status" checked={!published} onChange={() => set({ implemented: false })} />
            Coming soon: shown locked
          </label>
        </div>
        {published && !lessonIds.has(topic.id) && (
          <p className="mt-2 text-xs text-[#f5c542]">This topic is published but has no saved lesson yet, so students would find it empty.</p>
        )}
      </fieldset>
    </div>
  );
};
