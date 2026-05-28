// src/components/Questions.tsx

import React from 'react';
import type { Question } from '@/types/quiz';

interface QuestionsProps {
  currentIndex: number;
  question: Question;
  selectedOption: number | null;
  hasSubmitted: boolean;
  feedback: string;
  onSelectOption: (index: number) => void;
  wrongChoices: number[];
  questionCompleted: boolean;
  showAnswersEnabled: boolean;
  questionStyles?: React.CSSProperties;
  optionStyles?: React.CSSProperties;
  showCorrectAnswers?: boolean;
  timeMode?: boolean;
  timeLimit?: number;
  questionStartTime?: number;
}

const Questions: React.FC<QuestionsProps> = ({
  currentIndex,
  question,
  selectedOption,
  onSelectOption,
  wrongChoices,
  questionCompleted,
  showAnswersEnabled,
  questionStyles,
  optionStyles,
}) => {
  const getOptionClasses = (idx: number): { bg: string; border: string } => {
    if (!questionCompleted) {
      if (selectedOption === idx) return { bg: 'bg-[#253462]', border: 'border-[#414D61]' };
      if (wrongChoices.includes(idx)) return { bg: 'bg-[rgba(51,24,27,0.8)]', border: 'border-[#85131E]' };
      return { bg: 'bg-transparent', border: 'border-brand-border' };
    }
    if (idx === question.correctAnswer) return { bg: 'bg-[rgba(29,55,35,0.8)]', border: 'border-[#407440]' };
    if (wrongChoices.includes(idx)) return { bg: 'bg-[rgba(51,24,27,0.8)]', border: 'border-[#85131E]' };
    return { bg: 'bg-transparent', border: 'border-[#414D61]' };
  };

  return (
    <div className="w-full max-w-225 text-center">
      <div className="mx-auto w-full max-w-225 text-center">
        <h2
          style={questionStyles}
          aria-live="polite"
          aria-atomic="true"
        >
          {question.question}
        </h2>
      </div>

      <div className="relative mx-auto flex w-full max-w-150 flex-col gap-4" role="group" aria-label="Quiz answer options">
        {/* Try Again Indicator */}
        {showAnswersEnabled && wrongChoices.length > 0 && !questionCompleted && (
          <div className="
            absolute -top-12.5 left-0 z-10 rounded-2xl bg-[#A25313] px-2 py-1
            font-inter text-base font-normal text-white
          " role="status" aria-live="polite">
            Try again
          </div>
        )}

        {question.options.map((opt, idx) => {
          const isWrongDisabled = !questionCompleted && wrongChoices.includes(idx);
          const isDisabled = questionCompleted || isWrongDisabled;
          const { bg, border } = getOptionClasses(idx);

          return (
            <button
              key={`q${currentIndex}-opt${idx}`}
              className={`
                quiz-option appearance-none rounded-lg border-2 px-6 py-3.5
                text-left transition-[background-color] duration-200
                ${bg}
                ${border}
              `}
              style={{ ...optionStyles, ...(isDisabled ? { cursor: 'not-allowed' } : {}) }}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  onSelectOption(idx);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                  e.preventDefault();
                  onSelectOption(idx);
                }
              }}
              aria-label={`Option ${idx + 1}: ${opt}`}
              aria-pressed={selectedOption === idx}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Questions;
