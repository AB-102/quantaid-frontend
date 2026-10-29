// Picks the lesson content a quiz question's "Review lesson content" shows. Blocks without a label get one.

import React, { useState } from 'react';
import type { ContentBlock } from '@/types/lesson';
import { blockSnippet } from './lessonSource';
import Modal from './Modal';
import { hintCls, primaryBtnCls, secondaryBtnCls } from './styles';

interface LinkContentDialogProps {
  questionNumber: number;
  blocks: ContentBlock[];
  linkedLabels: string[];
  onApply: (blockIndices: number[]) => void;
  onClose: () => void;
}

const TYPE_NAMES: Record<ContentBlock['type'], string> = {
  heading: 'Heading',
  subheading: 'Subheading',
  paragraph: 'Text',
  image: 'Image',
};

const LinkContentDialog: React.FC<LinkContentDialogProps> = ({ questionNumber, blocks, linkedLabels, onApply, onClose }) => {
  const [chosen, setChosen] = useState<Set<number>>(
    () => new Set(blocks.flatMap((block, i) => (block.id && linkedLabels.includes(block.id) ? [i] : []))),
  );

  const toggle = (index: number) => setChosen(prev => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });

  return (
    <Modal title={`Content reviewed by question ${questionNumber}`} onClose={onClose} wide>
      <p className={`
        ${hintCls}
        mt-0 mb-3
      `}>
        Students see these blocks when they choose &ldquo;Review lesson content&rdquo; on this question. Blocks
        you pick that have no label get one, which you&apos;ll see as {'{#label}'} in the source.
      </p>
      <ul className="m-0 mb-4 list-none space-y-1 p-0">
        {blocks.map((block, index) => (
          <li key={index}>
            <label className="
              flex cursor-pointer items-start gap-3 rounded-md border
              border-brand-border-dark px-3 py-2
              hover:bg-white/5
            ">
              <input type="checkbox" checked={chosen.has(index)} onChange={() => toggle(index)} className="
                mt-1
              " />
              <span className="min-w-0 flex-1 text-[13px]">
                <span className="
                  mr-2 text-[11px] font-semibold text-[#60a5fa] uppercase
                ">{TYPE_NAMES[block.type]}</span>
                <span className={block.type === 'paragraph' ? 'text-[#C9D1DC]' : `
                  font-semibold text-white
                `}>{blockSnippet(block)}</span>
                {block.id && <span className="ml-2 text-[11px] text-[#6B7280]">#{block.id}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
        <button onClick={() => onApply([...chosen].sort((a, b) => a - b))} className={primaryBtnCls}>Apply</button>
      </div>
    </Modal>
  );
};

export default LinkContentDialog;
