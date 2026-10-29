import React from 'react';

interface QuizResultsScreenProps {
  score: number;
  totalQuestions: number;
  passed: boolean;
  passPercent: number;
  durationMinutes: number | null;
  durationSeconds: number | null;
}

const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({
  score,
  totalQuestions,
  passed,
  passPercent,
  durationMinutes,
  durationSeconds,
}) => {
  const percent = Math.round((score / totalQuestions) * 100);
  const circumferenceResults = 2 * Math.PI * 25;
  const rotation = -90 + (360 - (percent * 3.6)) / 2;
  const strokeDashoffsetResults = circumferenceResults * (1 - (percent / 100));

  const progressCircleStyle: React.CSSProperties & Record<string, unknown> = {
    transform: `rotate(${rotation}deg)`,
    transformOrigin: '35px 35px',
    '--final-offset': strokeDashoffsetResults,
    '--final-rotation': `${rotation}deg`,
    animation: 'fillFromBottom 1s ease-out forwards',
  };

  return (
    <div className="flex size-full flex-col items-center justify-center p-10">
      <div className="mb-12.5 text-center">
        <h1 className="m-0 font-inter text-[36px] font-semibold text-white">
          {passed ? 'Lesson complete!' : 'Not quite there yet'}
        </h1>
        {!passed && (
          <p className="
            mt-3 mb-0 font-inter text-lg font-normal text-brand-cool
          ">
            You need {passPercent}% to pass. Review the lesson, then try the quiz again.
          </p>
        )}
      </div>

      <div className="mb-15 flex items-center justify-center gap-20">
        {/* Accuracy Circle */}
        <div className="flex flex-col items-center">
          <div className="relative mb-0 flex items-center justify-center">
            <svg width="70" height="70">
              <circle
                cx="35"
                cy="35"
                r="25"
                fill="none"
                stroke="#424E62"
                strokeWidth="4.8"
              />
              <circle
                cx="35"
                cy="35"
                r="25"
                fill="none"
                stroke={passed ? '#92B03C' : '#FFC107'}
                strokeWidth="4.8"
                strokeDasharray={circumferenceResults}
                strokeDashoffset={strokeDashoffsetResults}
                strokeLinecap="round"
                style={progressCircleStyle}
              />
            </svg>
            <div className="
              absolute top-1/2 left-1/2 -translate-1/2 font-inter text-base
              font-semibold text-white
            ">{percent}%</div>
          </div>
          <p className="m-0 font-inter text-lg font-normal text-brand-cool">Accuracy</p>
        </div>

        {/* Time Section */}
        <div className="flex flex-col items-center">
          <div className="
            mt-[2%] mb-[-2%] flex h-17.5 items-center justify-center
          ">
            {durationMinutes !== null && durationSeconds !== null && (
              <span className="font-inter text-lg font-semibold text-white">
                {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <p className="m-0 font-inter text-lg font-normal text-brand-cool">Minutes</p>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsScreen;
