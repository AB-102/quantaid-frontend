import React from 'react';
import { MdOutlineThumbsUpDown } from 'react-icons/md';

interface QuizFooterProps {
  showResultsScreen: boolean;
  hasSubmitted: boolean;
  questionCompleted: boolean;
  showAnswersEnabled: boolean;
  isCorrect: boolean | null;
  canContinue: boolean;
  showReviewConcept: boolean;
  timeModeEnabled: boolean;
  timeRemaining: number;
  timeLimit: number;
  circumference: number;
  strokeDashoffset: number;
  getTimerColor: () => string;
  onLeaveFeedback: () => void;
  onSkip: () => void;
  onReviewConcept: () => void;
  onCloseReviewConcept: () => void;
  onContinue: () => void;
}

const QuizFooter: React.FC<QuizFooterProps> = ({
  showResultsScreen,
  hasSubmitted,
  questionCompleted,
  showAnswersEnabled,
  isCorrect,
  canContinue,
  showReviewConcept,
  timeModeEnabled,
  circumference,
  strokeDashoffset,
  getTimerColor,
  onLeaveFeedback,
  onSkip,
  onReviewConcept,
  onCloseReviewConcept,
  onContinue,
}) => {
  const isDisabled = !showResultsScreen && !canContinue && !questionCompleted;

  return (
    <div
      className="
        relative z-10 mt-auto flex w-full items-center justify-center border-t
        border-[rgba(66,78,98,0.3)] transition-[background-color] duration-150
      "
      style={{ backgroundColor: !showResultsScreen && hasSubmitted ? '#1A2540' : 'transparent' }}
    >
      <div className="
        my-6 flex w-[65%] max-w-337.5 items-center justify-between
      ">
        {/* Left side - Timer, Result Icon, or Leave Feedback */}
        <div className="flex h-15 min-w-15 items-center">
          {showResultsScreen ? (
            <button
              className="
                quiz-bottom-buttons flex min-w-35 cursor-pointer items-center
                justify-center gap-2 border-transparent bg-transparent px-9 py-3
                font-sarabun text-base font-medium text-brand-gray
                transition-all duration-200
              "
              onClick={onLeaveFeedback}
            >
              <MdOutlineThumbsUpDown size={17} color="#9D9D9D" />
              <span className="
                font-sarabun text-base leading-none font-medium text-brand-gray
              ">Leave Feedback</span>
            </button>
          ) : questionCompleted && showAnswersEnabled ? (
            <div className="flex min-w-15 items-center justify-center">
              <svg width="60" height="60">
                <circle
                  cx="30"
                  cy="30"
                  r="25"
                  fill='#03123A'
                  stroke={isCorrect ? '#407440' : '#03123A'}
                  strokeWidth="3"
                />
                {isCorrect ? (
                  <path
                    d="M18 30 L26 38 L42 22"
                    stroke="#407440"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <g stroke="#C61325" strokeWidth="5" strokeLinecap="round">
                    <path d="M20 20 L40 40" />
                    <path d="M40 20 L20 40" />
                  </g>
                )}
              </svg>
            </div>
          ) : (
            timeModeEnabled && (
              <div className="flex items-center justify-center">
                <svg width="40" height="40" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}>
                  <defs>
                    <mask id="timer-mask">
                      <rect width="40" height="40" fill="black" />
                      <circle
                        cx="20"
                        cy="20"
                        r="12"
                        fill="none"
                        stroke="white"
                        strokeWidth="24"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                          transform: 'rotate(90deg) scaleX(-1)',
                          transformOrigin: '20px 20px',
                          transition: 'stroke-dashoffset 0.1s ease-out'
                        }}
                      />
                    </mask>
                  </defs>

                  <circle
                    cx="20"
                    cy="20"
                    r="17"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="12"
                    fill={getTimerColor()}
                    mask="url(#timer-mask)"
                    style={{ transition: 'fill 0.3s ease' }}
                  />
                </svg>
              </div>
            )
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-4">
          {!showResultsScreen && (
            <button
              className="
                quiz-bottom-buttons min-w-20 cursor-pointer border-transparent
                bg-transparent px-10.5 py-3 font-sarabun text-[22px] font-medium
                text-[#AAABAF] transition-all duration-200
              "
              onClick={
                ((!questionCompleted && showAnswersEnabled) || !showAnswersEnabled) ? onSkip :
                (showReviewConcept ? onCloseReviewConcept : onReviewConcept)}
            >
              {
              ((!questionCompleted && showAnswersEnabled) || !showAnswersEnabled) ? 'SKIP' :
              (showReviewConcept ? 'CLOSE CONCEPT' : 'REVIEW CONCEPT')}
            </button>
          )}

          <button
            className="
              quiz-bottom-buttons min-w-25 rounded-2xl border-none px-10.5 py-3
              font-sarabun text-[22px] font-medium transition-all duration-200
            "
            onClick={onContinue}
            disabled={isDisabled}
            style={{
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              color: showResultsScreen || canContinue || questionCompleted ? '#FFFFFF' : '#AAABAF',
              backgroundColor: showResultsScreen
                ? '#142748'
                : !showAnswersEnabled
                  ? (canContinue ? '#142748' : '#2A3A52')
                  : (questionCompleted
                  ? (isCorrect ? '#406440' : '#A20F1D')
                  : (canContinue ? '#142748' : '#2A3A52')),
            }}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizFooter;
