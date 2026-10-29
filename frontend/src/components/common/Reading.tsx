// src/components/Reading.tsx

import React, { useEffect, useState } from 'react';
import HighlightableInstructionsForReading from './HighlightableInstructionsForReadings';
import LessonBlocks from './LessonBlocks';

import api from '@/api';
import type { ContentBlock } from '@/types/lesson';

interface ApiLesson {
  id: string;
  courseId: number;
  title: string;
  blocks: ContentBlock[];
  quiz: unknown[];
  interactiveTerms?: Record<string, string>;
}

interface Props {
  courseId?: number;
  onExplainRequest: (text: string) => void;
  onViewAnalogy: (text: string) => void;
}

const Reading: React.FC<Props> = ({
  courseId = 0,
  onExplainRequest,
  onViewAnalogy,
}) => {
  const [apiLesson, setApiLesson] = useState<ApiLesson | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch lesson from API
  useEffect(() => {
    let cancelled = false;
    setFetchAttempted(false);
    setFetchError(false);
    setApiLesson(null);

    api.get(`/lessons/${courseId}`)
      .then(res => {
        if (!cancelled) setApiLesson(res.data);
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setFetchAttempted(true);
      });

    return () => { cancelled = true; };
  }, [courseId]);

  if (!fetchAttempted) {
    return <p className="text-[#aab4c8]">Loading lesson...</p>;
  }

  if (fetchError || !apiLesson) {
    return <p className="text-[#f87171]">Lesson content is temporarily unavailable.</p>;
  }

  return (
    <HighlightableInstructionsForReading
      onExplain={onExplainRequest}
      onViewAnalogy={onViewAnalogy}
    >
      <div className="
        cursor-text bg-transparent font-inter text-base leading-[1.2]
        font-normal text-white
      ">
        <LessonBlocks blocks={apiLesson.blocks} terms={apiLesson.interactiveTerms} />
      </div>
    </HighlightableInstructionsForReading>
  );
};

export default Reading;
