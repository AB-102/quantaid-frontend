// The content tree: Sections → Courses → Concepts → Topics. Selecting a row opens it in the panel beside the tree;
// rows reorder by dragging their handle (or with the keyboard: focus the handle, Space, arrow keys, Space).

import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState } from 'react';
import type { Concept, Course, DashboardConfig, DashboardSection, Topic } from '@/types/course';
import RowMenu, { type RowAction } from './RowMenu';
import {
  moveConcept, moveCourseInSection, moveSection, moveTopic, type Selection, topicStatus, type TopicStatus, unassignedCourses,
} from './structure';
import { inputCls, secondaryBtnCls } from './styles';

interface ContentOutlineProps {
  config: DashboardConfig;
  lessonIds: Set<number>;
  orphanLessons: { courseId: number; title: string }[];
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
  onChange: (config: DashboardConfig) => void;
  onDelete: (selection: Selection) => void;
  onAddSection: () => void;
}

const STATUS_CHIPS: Record<TopicStatus, { label: string; className: string }> = {
  'published': { label: 'Published', className: 'bg-[#1a3b2a] text-success' },
  'coming-soon': { label: 'Coming soon', className: 'bg-[#2a2e46] text-[#AAB4C8]' },
  'no-lesson': { label: 'No lesson yet', className: 'bg-[#3b321a] text-[#f5c542]' },
};

const sameSelection = (a: Selection | null, b: Selection): boolean => JSON.stringify(a) === JSON.stringify(b);

// --- Drag and drop ---

const SortableGroup: React.FC<{ ids: string[]; onMove: (from: number, to: number) => void; children: React.ReactNode }> = ({ ids, onMove, children }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="m-0 list-none p-0">{children}</ul>
      </SortableContext>
    </DndContext>
  );
};

const SortableItem: React.FC<{ id: string; label: string; draggable: boolean; children: (handle: React.ReactNode) => React.ReactNode }> = ({ id, label, draggable, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !draggable });
  const handle = draggable ? (
    <button
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${label}`}
      className="
        cursor-grab rounded-sm border-none bg-transparent px-1 text-xs
        text-[#5B6478]
        hover:text-[#C9D1DC]
      "
    >
      ⠿
    </button>
  ) : <span className="w-5" />;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}>
      {children(handle)}
    </li>
  );
};

// --- Rows ---

interface RowProps {
  depth: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
  handle?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  meta?: string;
  chip?: TopicStatus;
  actions?: RowAction[];
}

const Row: React.FC<RowProps> = ({ depth, label, selected, onSelect, handle, expanded, onToggle, meta, chip, actions }) => (
  <div
    className={`
      group flex items-center gap-1 rounded-md py-1 pr-1
      ${selected ? 'bg-[#1e3a5f]' : 'hover:bg-white/5'}
    `}
    style={{ paddingLeft: depth * 14 }}
  >
    {handle}
    {onToggle ? (
      <button
        onClick={onToggle}
        aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        className="
          w-5 cursor-pointer border-none bg-transparent p-0 text-xs
          text-[#8A94A6]
        "
      >
        {expanded ? '▾' : '▸'}
      </button>
    ) : <span className="w-5" />}
    <button
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`
        min-w-0 flex-1 cursor-pointer truncate border-none bg-transparent p-0
        text-left font-inter text-[13px]
        ${selected ? 'text-white' : 'text-[#C9D1DC]'}
      `}
    >
      {label}
    </button>
    {meta && <span className="shrink-0 text-[11px] text-[#6B7280]">{meta}</span>}
    {chip && (
      <span className={`
        shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium
        ${STATUS_CHIPS[chip].className}
      `}>{STATUS_CHIPS[chip].label}</span>
    )}
    {actions && <RowMenu label={label} actions={actions} />}
  </div>
);

const moveActions = (index: number, count: number, move: (to: number) => void): RowAction[] => [
  { label: 'Move up', onSelect: () => move(index - 1), disabled: index === 0 },
  { label: 'Move down', onSelect: () => move(index + 1), disabled: index === count - 1 },
];

const ContentOutline: React.FC<ContentOutlineProps> = ({
  config, lessonIds, orphanLessons, selection, onSelect, onChange, onDelete, onAddSection,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(config.sections.map(s => `section:${s.id}`)));
  const [filter, setFilter] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const query = filter.trim().toLowerCase();
  const filtering = query !== '';
  const matches = (title: string) => title.toLowerCase().includes(query);
  const conceptMatches = (concept: Concept) => matches(concept.title) || concept.topics.some(t => matches(t.title));
  const courseMatches = (course: Course) => matches(course.title) || course.concepts.some(conceptMatches);

  const isExpanded = (key: string) => filtering || expanded.has(key);
  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const renderTopics = (course: Course, concept: Concept, showAll: boolean) => {
    const topics = concept.topics.filter(t => showAll || !filtering || matches(t.title));
    const items = topics.map((topic: Topic, index) => {
      const sel: Selection = { kind: 'topic', courseId: course.id, conceptId: concept.id, topicId: topic.id };
      return (
        <SortableItem key={topic.id} id={`topic-${topic.id}`} label={topic.title} draggable={!filtering}>
          {handle => (
            <Row
              depth={3}
              label={topic.title}
              handle={handle}
              selected={sameSelection(selection, sel)}
              onSelect={() => onSelect(sel)}
              chip={topicStatus(topic, lessonIds)}
              actions={[
                ...moveActions(index, topics.length, to => onChange(moveTopic(config, course.id, concept.id, index, to))),
                { label: 'Remove topic', onSelect: () => onDelete(sel), danger: true },
              ]}
            />
          )}
        </SortableItem>
      );
    });
    return (
      <SortableGroup ids={topics.map(t => `topic-${t.id}`)} onMove={(from, to) => onChange(moveTopic(config, course.id, concept.id, from, to))}>
        {items}
      </SortableGroup>
    );
  };

  const renderConcepts = (course: Course, showAll: boolean) => {
    const concepts = course.concepts.filter(c => showAll || !filtering || conceptMatches(c));
    return (
      <SortableGroup ids={concepts.map(c => `concept-${c.id}`)} onMove={(from, to) => onChange(moveConcept(config, course.id, from, to))}>
        {concepts.map((concept, index) => {
          const key = `concept:${course.id}:${concept.id}`;
          const sel: Selection = { kind: 'concept', courseId: course.id, conceptId: concept.id };
          return (
            <SortableItem key={concept.id} id={`concept-${concept.id}`} label={concept.title} draggable={!filtering}>
              {handle => (
                <>
                  <Row
                    depth={2}
                    label={concept.title}
                    handle={handle}
                    expanded={isExpanded(key)}
                    onToggle={() => toggle(key)}
                    selected={sameSelection(selection, sel)}
                    onSelect={() => onSelect(sel)}
                    meta={`${concept.topics.length}`}
                    actions={[
                      ...moveActions(index, concepts.length, to => onChange(moveConcept(config, course.id, index, to))),
                      { label: 'Remove concept', onSelect: () => onDelete(sel), danger: true },
                    ]}
                  />
                  {isExpanded(key) && renderTopics(course, concept, showAll || matches(concept.title))}
                </>
              )}
            </SortableItem>
          );
        })}
      </SortableGroup>
    );
  };

  const renderCourseRow = (course: Course, handle: React.ReactNode, actions: RowAction[], showAll: boolean) => {
    const key = `course:${course.id}`;
    const sel: Selection = { kind: 'course', courseId: course.id };
    return (
      <>
        <Row
          depth={1}
          label={course.title}
          handle={handle}
          expanded={isExpanded(key)}
          onToggle={() => toggle(key)}
          selected={sameSelection(selection, sel)}
          onSelect={() => onSelect(sel)}
          actions={[...actions, { label: 'Delete course', onSelect: () => onDelete(sel), danger: true }]}
        />
        {isExpanded(key) && renderConcepts(course, showAll || matches(course.title))}
      </>
    );
  };

  const renderSection = (section: DashboardSection, index: number, count: number) => {
    const key = `section:${section.id}`;
    const sel: Selection = { kind: 'section', sectionId: section.id };
    const showAll = matches(section.title);
    const courses = section.courses
      .map(id => config.courses.find(c => c.id === id))
      .filter((c): c is Course => c !== undefined && (showAll || !filtering || courseMatches(c)));
    if (filtering && !showAll && courses.length === 0) return null;
    return (
      <SortableItem key={section.id} id={`section-${section.id}`} label={section.title} draggable={!filtering}>
        {handle => (
          <>
            <Row
              depth={0}
              label={section.title}
              handle={handle}
              expanded={isExpanded(key)}
              onToggle={() => toggle(key)}
              selected={sameSelection(selection, sel)}
              onSelect={() => onSelect(sel)}
              meta={`${section.courses.length} course${section.courses.length === 1 ? '' : 's'}`}
              actions={[
                ...moveActions(index, count, to => onChange(moveSection(config, index, to))),
                { label: 'Delete section', onSelect: () => onDelete(sel), danger: true },
              ]}
            />
            {isExpanded(key) && (
              <SortableGroup ids={courses.map(c => `course-${c.id}`)} onMove={(from, to) => onChange(moveCourseInSection(config, section.id, from, to))}>
                {courses.map((course, courseIndex) => (
                  <SortableItem key={course.id} id={`course-${course.id}`} label={course.title} draggable={!filtering}>
                    {courseHandle => renderCourseRow(
                      course,
                      courseHandle,
                      moveActions(courseIndex, courses.length, to => onChange(moveCourseInSection(config, section.id, courseIndex, to))),
                      showAll,
                    )}
                  </SortableItem>
                ))}
              </SortableGroup>
            )}
          </>
        )}
      </SortableItem>
    );
  };

  const sections = [...config.sections].sort((a, b) => a.order - b.order);
  const unassigned = unassignedCourses(config).filter(c => !filtering || courseMatches(c));
  const orphans = orphanLessons.filter(l => !filtering || matches(l.title));

  return (
    <nav aria-label="Content outline" className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by title…"
          aria-label="Filter the outline by title"
          className={inputCls}
        />
        <button onClick={onAddSection} className={secondaryBtnCls}>+ Section</button>
      </div>

      <div className="
        rounded-md border border-brand-border-dark bg-[#0d1a30] text-xs
        text-[#AAB4C8]
      ">
        <button
          onClick={() => setShowHelp(v => !v)}
          aria-expanded={showHelp}
          className="
            w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left
            text-xs text-[#AAB4C8]
          "
        >
          {showHelp ? '▾' : '▸'} How content is organised
        </button>
        {showHelp && (
          <ul className="m-0 list-disc space-y-1 pr-3 pb-3 pl-7">
            <li><b>Sections</b> are the rows of course cards on the student dashboard, top to bottom.</li>
            <li><b>Courses</b> are the cards. Students unlock them in order, after finishing every published topic of the one before.</li>
            <li><b>Concepts</b> group a course&apos;s topics on its page.</li>
            <li><b>Topics</b> are lessons, each with its own quiz. <i>Coming soon</i> topics show locked.</li>
            <li>Changes to this outline are saved with <b>Save</b> (Ctrl+S).</li>
          </ul>
        )}
      </div>

      <SortableGroup ids={sections.map(s => `section-${s.id}`)} onMove={(from, to) => onChange(moveSection(config, from, to))}>
        {sections.map((section, index) => renderSection(section, index, sections.length))}
      </SortableGroup>
      {sections.length === 0 && <p className="m-0 text-[13px] text-[#6B7280]">No sections yet. Add one to start building the dashboard.</p>}

      {unassigned.length > 0 && (
        <div>
          <h3 className="
            mb-1 text-[11px] font-semibold tracking-wide text-[#f5c542]
            uppercase
          ">Courses not on the dashboard</h3>
          <ul className="m-0 list-none p-0">
            {unassigned.map(course => (
              <li key={course.id}>{renderCourseRow(course, <span className="w-5" />, [], false)}</li>
            ))}
          </ul>
        </div>
      )}

      {orphans.length > 0 && (
        <div>
          <h3 className="
            mb-1 text-[11px] font-semibold tracking-wide text-[#f5c542]
            uppercase
          ">Lessons not on the dashboard</h3>
          <ul className="m-0 list-none p-0">
            {orphans.map(lesson => {
              const sel: Selection = { kind: 'lesson', lessonId: lesson.courseId };
              return (
                <li key={lesson.courseId}>
                  <Row depth={0} label={lesson.title} selected={sameSelection(selection, sel)} onSelect={() => onSelect(sel)} meta={`#${lesson.courseId}`} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default ContentOutline;
