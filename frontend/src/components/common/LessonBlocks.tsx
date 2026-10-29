// src/components/common/LessonBlocks.tsx
// A lesson's blocks as students see them: in the lesson, in the quiz's review panel and in the editor preview.

import React from 'react';
import { BACKEND_URL } from '@/api';
import type { ContentBlock } from '@/types/lesson';
import { termsIn } from './glossary';
import LessonText from './LessonText';

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
    <figure id={block.id} role="figure" aria-label={block.alt || block.caption || 'Lesson image'} style={figureStyle}>
      <img
        src={`${BACKEND_URL}/api/files/${block.fileId}`}
        alt=""
        aria-hidden="true"
        style={imgStyle}
        draggable={false}
      />
      {block.caption && <figcaption style={captionStyle}>{block.caption}</figcaption>}
    </figure>
  );
};

// Each glossary term is underlined once per lesson, in the first paragraph that uses it
function termsPerBlock(blocks: ContentBlock[], terms: Record<string, string>): Record<string, string>[] {
  const unmarked = new Set(Object.keys(terms));
  return blocks.map(block => {
    const blockTerms: Record<string, string> = {};
    if (block.type !== 'paragraph' || !block.text) return blockTerms;
    for (const term of termsIn(block.text, [...unmarked])) {
      blockTerms[term] = terms[term];
      unmarked.delete(term);
    }
    return blockTerms;
  });
}

interface LessonBlocksProps {
  blocks: ContentBlock[];
  terms?: Record<string, string>;
}

const LessonBlocks: React.FC<LessonBlocksProps> = ({ blocks, terms = {} }) => {
  const blockTerms = termsPerBlock(blocks, terms);
  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === 'image') return <ImageBlock key={idx} block={block} />;

        const text = block.text ?? '';
        if (block.type === 'heading') {
          return (
            <h3 key={idx} id={block.id} className="
              mt-8 mb-4 text-[1.4rem] font-semibold tracking-[0.75px]
            ">
              <LessonText markdown={text} inline />
            </h3>
          );
        }
        if (block.type === 'subheading') {
          return (
            <h4 key={idx} id={block.id} className="
              mt-6 mb-3 text-[1.2rem] font-medium tracking-[0.75px]
            ">
              <LessonText markdown={text} inline />
            </h4>
          );
        }
        return (
          <div key={idx} id={block.id} className="mb-6">
            <LessonText markdown={text} terms={blockTerms[idx]} />
          </div>
        );
      })}
    </>
  );
};

export default LessonBlocks;
