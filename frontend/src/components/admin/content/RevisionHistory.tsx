// Earlier versions of a lesson: each save keeps the version it replaces. Loading one puts it in the editor
// unsaved, so restoring is just another save (and the version it replaces is kept too).

import React, { useEffect, useState } from 'react';
import api from '@/api';
import LessonBlocks from '@/components/common/LessonBlocks';
import type { ContentBlock } from '@/types/lesson';
import type { Question } from '@/types/quiz';
import { lessonToSource } from './lessonSource';
import { hintCls, primaryBtnCls } from './styles';

interface RevisionSummary {
  id: string;
  title: string;
  savedAt: string | null;
  savedBy: string | null;
  blockCount: number;
  questionCount: number;
}

interface Revision {
  id: string;
  title: string;
  blocks: ContentBlock[];
  quiz: Question[];
  interactiveTerms: Record<string, string>;
}

interface RevisionHistoryProps {
  lessonId: number;
  // Changes after each save, so the list picks up the version that save replaced
  version: number;
  onLoad: (title: string, source: string) => void;
}

const formatDate = (date: string | null): string =>
  date ? new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date';

const RevisionHistory: React.FC<RevisionHistoryProps> = ({ lessonId, version, onLoad }) => {
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [selected, setSelected] = useState<Revision | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSelected(null);
    api.get<RevisionSummary[]>(`/admin/lessons/${lessonId}/revisions`)
      .then(res => { if (!cancelled) setRevisions(res.data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [lessonId, version]);

  const open = (id: string) => {
    api.get<Revision>(`/admin/lessons/${lessonId}/revisions/${id}`)
      .then(res => setSelected(res.data))
      .catch(() => setError(true));
  };

  if (error) return <p className="text-error">Couldn&apos;t load the lesson&apos;s history.</p>;
  if (revisions === null) return <p className="text-[#9DA7B7]">Loading history…</p>;
  if (revisions.length === 0) {
    return <p className="text-[#9DA7B7]">No earlier versions yet. Each time you save, the version you replace is kept here.</p>;
  }

  return (
    <div className="
      grid gap-4
      xl:grid-cols-[minmax(240px,1fr)_2fr]
    ">
      <ul className="m-0 list-none space-y-1 p-0">
        {revisions.map(revision => (
          <li key={revision.id}>
            <button
              onClick={() => open(revision.id)}
              aria-current={selected?.id === revision.id ? 'true' : undefined}
              className={`
                w-full cursor-pointer rounded-md border border-brand-border-dark
                px-3 py-2 text-left font-inter text-[13px]
                hover:bg-white/5
                ${selected?.id === revision.id ? 'bg-[#1e3a5f]' : `
                  bg-transparent
                `}
              `}
            >
              <span className="block text-[#E5E7EB]">{formatDate(revision.savedAt)}</span>
              <span className="block text-xs text-[#8A94A6]">
                {revision.savedBy ?? 'Saved before history was kept'} · {revision.blockCount} blocks · {revision.questionCount} questions
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div>
        {selected ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className={`
                ${hintCls}
                m-0
              `}>Loading it replaces the editor&apos;s content until you save.</p>
              <button
                onClick={() => onLoad(selected.title, lessonToSource(selected))}
                className={primaryBtnCls}
              >
                Load into editor
              </button>
            </div>
            <div className="
              max-h-[60vh] overflow-y-auto rounded-lg border
              border-brand-border-dark bg-brand-bg p-5 font-inter text-base
              leading-[1.2] text-white
            ">
              <h2 className="m-0 mb-6 text-[28px] font-medium">{selected.title}</h2>
              <LessonBlocks blocks={selected.blocks} terms={selected.interactiveTerms} />
            </div>
          </>
        ) : (
          <p className="text-[#9DA7B7]">Choose a version to preview it.</p>
        )}
      </div>
    </div>
  );
};

export default RevisionHistory;
