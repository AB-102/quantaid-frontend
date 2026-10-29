// Takes an AI assistant's revised lesson, shows what it would change, and loads it into the editor unsaved

import React, { useMemo, useState } from 'react';
import { readAiReply } from './aiPrompt';
import { type ParsedLesson, sourceToLesson } from './lessonSource';
import Modal from './Modal';
import { hintCls, inputCls, primaryBtnCls, secondaryBtnCls } from './styles';

interface PasteFromAiDialogProps {
  current: ParsedLesson;
  onReplace: (title: string | null, source: string) => void;
  onClose: () => void;
}

const PasteFromAiDialog: React.FC<PasteFromAiDialogProps> = ({ current, onReplace, onClose }) => {
  const [reply, setReply] = useState('');
  const pasted = useMemo(() => readAiReply(reply), [reply]);
  const parsed = useMemo(() => sourceToLesson(pasted.source), [pasted.source]);
  const hasReply = reply.trim() !== '';

  const rows = [
    ['Blocks', current.blocks.length, parsed.blocks.length],
    ['Quiz questions', current.quiz.length, parsed.quiz.length],
    ['Glossary terms', Object.keys(current.interactiveTerms).length, Object.keys(parsed.interactiveTerms).length],
  ] as const;

  return (
    <Modal title="Paste from AI" onClose={onClose} wide>
      <p className={`
        ${hintCls}
        mt-0 mb-3
      `}>
        Paste the assistant&apos;s whole reply. It replaces the lesson in the editor; nothing is saved until you press Save,
        and the version it replaces stays in History once you do.
      </p>
      <textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        rows={12}
        aria-label="The AI assistant's reply"
        placeholder="Paste here…"
        className={`
          ${inputCls}
          mb-4 resize-y font-mono text-xs
        `}
      />
      {hasReply && (
        <div className="mb-4 text-[13px]">
          {pasted.title && <p className="m-0 mb-2 text-[#C9D1DC]">New title: <b>{pasted.title}</b></p>}
          <table className="mb-3 border-collapse text-left">
            <tbody>
              {rows.map(([name, before, after]) => (
                <tr key={name}>
                  <td className="py-0.5 pr-6 text-[#AAB4C8]">{name}</td>
                  <td className="py-0.5 pr-2">{before}</td>
                  <td className="py-0.5 pr-2 text-[#6B7280]">→</td>
                  <td className={`
                    py-0.5
                    ${before === after ? '' : 'font-semibold text-[#f5c542]'}
                  `}>{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsed.problems.length === 0 ? (
            <p className="m-0 text-success">No problems found.</p>
          ) : (
            <div className="text-error">
              <p className="m-0 mb-1">{parsed.problems.length} problem{parsed.problems.length === 1 ? '' : 's'} to fix before saving:</p>
              <ul className="m-0 list-disc pl-5">
                {parsed.problems.slice(0, 5).map((problem, i) => <li key={i}>Line {problem.line}: {problem.message}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={secondaryBtnCls}>Cancel</button>
        <button onClick={() => onReplace(pasted.title, pasted.source)} disabled={!hasReply} className={primaryBtnCls}>
          Replace lesson in editor
        </button>
      </div>
    </Modal>
  );
};

export default PasteFromAiDialog;
