// The lesson as students will see it, plus its quiz with each question's answer and the content it reviews

import React from 'react';
import LessonBlocks from '@/components/common/LessonBlocks';
import LessonText from '@/components/common/LessonText';
import { blockSnippet, type ParsedLesson } from './lessonSource';
import { secondaryBtnCls } from './styles';

interface LessonPreviewProps {
  title: string;
  lesson: ParsedLesson;
  onLinkQuestion: (index: number) => void;
}

const LessonPreview: React.FC<LessonPreviewProps> = ({ title, lesson, onLinkQuestion }) => {
  const byLabel = new Map(lesson.blocks.filter(b => b.id).map(b => [b.id, b]));

  return (
    <div className="font-inter text-white">
      <h2 className="m-0 mb-6 text-[28px] font-medium">{title || 'Untitled lesson'}</h2>
      <div className="text-base leading-[1.2]">
        <LessonBlocks blocks={lesson.blocks} terms={lesson.interactiveTerms} />
      </div>

      {lesson.quiz.length > 0 && (
        <section aria-label="Quiz preview" className="
          mt-10 border-t border-brand-border-dark pt-6
        ">
          <h3 className="m-0 mb-4 text-base font-semibold text-[#C9D1DC]">Quiz ({lesson.quiz.length} questions)</h3>
          {lesson.quiz.map((question, index) => {
            const labels = question.lessonBlockIds ?? [];
            return (
              <div key={index} className="
                mb-4 rounded-lg border border-brand-border-dark bg-brand-panel
                p-4
              ">
                <p className="
                  m-0 mb-2 text-[11px] font-semibold tracking-wide
                  text-[#60a5fa] uppercase
                ">Question {index + 1}</p>
                <p className="m-0 mb-3 text-[15px]"><LessonText markdown={question.question} inline /></p>
                <ul className="m-0 mb-3 list-none space-y-1 p-0 text-sm">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex} className={optionIndex === question.correctAnswer ? `
                      text-success
                    ` : `text-[#AAB4C8]`}>
                      {optionIndex === question.correctAnswer ? '✓ ' : '○ '}
                      <LessonText markdown={option} inline />
                    </li>
                  ))}
                </ul>
                {question.explanation && (
                  <div className="mb-3 text-sm text-[#AAB4C8] italic">
                    <LessonText markdown={question.explanation} />
                  </div>
                )}
                <div className="
                  flex flex-wrap items-start justify-between gap-2 border-t
                  border-brand-border-dark pt-3
                ">
                  <div className="min-w-0 flex-1 text-xs text-[#AAB4C8]">
                    <span className="font-semibold">Review lesson content shows: </span>
                    {labels.length === 0 && <span>the lesson&apos;s first three blocks (nothing linked)</span>}
                    {labels.map(label => {
                      const block = byLabel.get(label);
                      return (
                        <span key={label} className={`
                          mt-1 block
                          ${block ? '' : 'text-error'}
                        `}>
                          #{label}: {block ? blockSnippet(block) : 'no block has this label'}
                        </span>
                      );
                    })}
                  </div>
                  <button onClick={() => onLinkQuestion(index)} className={secondaryBtnCls}>Link content…</button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default LessonPreview;
