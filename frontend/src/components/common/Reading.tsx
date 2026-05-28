// src/components/Reading.tsx

import React, { useEffect, useMemo, useState } from 'react';
import HighlightableInstructionsForReading from './HighlightableInstructionsForReadings';

import api, { BACKEND_URL } from '@/api';
import type { ContentBlock } from '@/types/lesson';

interface ApiLesson {
  _id: string;
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

// Image block component — non-selectable, accessible
const ImageBlock: React.FC<{ block: ContentBlock }> = ({ block }) => {
  const widthPercent = block.width ?? 80;
  const align = block.align ?? 'center';

  const figureStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    margin: '32px 0',
    userSelect: 'none',
    pointerEvents: 'none' as const,
  };

  const imgStyle: React.CSSProperties = {
    maxWidth: `${widthPercent}%`,
    width: '100%',
    borderRadius: 8,
    objectFit: 'contain' as const,
  };

  const captionStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: '0.9rem',
    color: '#aab4c8',
    fontStyle: 'italic',
    textAlign: align,
    maxWidth: `${widthPercent}%`,
    userSelect: 'none',
  };

  return (
    <figure role="figure" aria-label={block.alt || block.caption || 'Lesson image'} style={figureStyle}>
      <img
        src={`${BACKEND_URL}/file/${block.fileId}`}
        alt=""
        aria-hidden="true"
        style={imgStyle}
        draggable={false}
      />
      {block.caption && <figcaption style={captionStyle}>{block.caption}</figcaption>}
    </figure>
  );
};

const blockClassName = (type: ContentBlock['type']): string => {
  if (type === 'heading')    return 'text-[1.4rem] font-semibold tracking-[0.75px] mt-8 mb-4';
  if (type === 'subheading') return 'text-[1.2rem] font-medium tracking-[0.75px] mt-6 mb-3';
  return 'mb-6'; // paragraph
};

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

    api.get(`/api/lessons/${courseId}`)
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

  const renderedContent = useMemo(() => {
    if (!apiLesson) return null;
    return apiLesson.blocks.map((block, idx) => {
      if (block.type === 'image') {
        return <ImageBlock key={idx} block={block} />;
      }

      const text = block.text || '';
      const className = blockClassName(block.type);

      if (block.type === 'heading')    return <h3 key={idx} className={className}>{text}</h3>;
      if (block.type === 'subheading') return <h4 key={idx} className={className}>{text}</h4>;
      return <p key={idx} className={className}>{text}</p>;
    });
  }, [apiLesson]);

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
        {renderedContent}
      </div>
    </HighlightableInstructionsForReading>
  );
};

export default Reading;
