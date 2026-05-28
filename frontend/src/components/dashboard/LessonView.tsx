import React from 'react';
import Reading from '../common/Reading';
import HighlightableInstructionsForReading from '../common/HighlightableInstructionsForReadings';
import type { Course, Topic } from '@/types/course';
import type { Question } from '@/types/quiz';

interface LessonViewProps {
  currentLesson: number | null;
  activeCourses: Course[];
  currentQuiz: Question[];
  handleOpenQuiz: () => void;
  renderBreadcrumb: () => React.ReactNode;
  handleExplain: (text: string) => void;
  handleAnalogy: (text: string) => void;
  lessonContentsRef: React.Ref<HTMLDivElement>;
}

const LessonView: React.FC<LessonViewProps> = ({
  currentLesson,
  activeCourses,
  currentQuiz,
  handleOpenQuiz,
  renderBreadcrumb,
  handleExplain,
  handleAnalogy,
  lessonContentsRef,
}) => {
  if (currentLesson === null) return <p>Loading lesson...</p>;

  let topicInfo: Topic | null = null;

  for (const course of activeCourses) {
    for (const concept of course.concepts) {
      const topic = concept.topics.find(t => t.id === currentLesson);
      if (topic) {
        topicInfo = topic;
        break;
      }
    }
    if (topicInfo) break;
  }

  return (
    <div className="mx-auto max-w-250 py-5">
      <div className="lesson-header mb-8 select-none">
        {renderBreadcrumb()}

        <h2 className="
          m-0 mx-auto cursor-text font-inter text-[36px] font-medium text-white
        ">{topicInfo?.title || 'Lesson'}</h2>
        {topicInfo?.description && (
          <p className="
            cursor-text font-inter text-lg leading-[1.6] font-normal text-white
          ">{topicInfo.description}</p>
        )}

        {currentQuiz.length > 0 && (
          <button
            className="
              my-6.25 mb-17.5 block cursor-pointer rounded-lg border-none
              bg-brand-light-blue px-3 py-2 font-inter text-[1.15rem]
              leading-[1.6] font-semibold text-brand-bg
              transition-[background-color] duration-200
            "
            onClick={handleOpenQuiz}
            aria-label="Start quiz for this lesson"
          >
            TAKE QUIZ
          </button>
        )}
        {currentQuiz.length === 0 && (
          <p className="mt-10 text-center text-base text-brand-blue">Quiz coming soon for this lesson!</p>
        )}
      </div>

      <div ref={lessonContentsRef}>
        <HighlightableInstructionsForReading
          onExplain={handleExplain}
          onViewAnalogy={handleAnalogy}
        >
          <Reading
            courseId={currentLesson}
            onExplainRequest={handleExplain}
            onViewAnalogy={handleAnalogy}
          />
        </HighlightableInstructionsForReading>
      </div>

      {currentQuiz.length > 0 && (
        <div className="lesson-header mt-17.5 cursor-text">
          <p className="
            cursor-text font-inter text-lg leading-[1.6] font-normal text-white
          ">
            Ready to see if you've grasped these concepts? Take this quiz and find out where you stand!
          </p>
          <button
            className="
              my-6.25 mb-17.5 block cursor-pointer rounded-lg border-none
              bg-brand-light-blue px-3 py-2 font-inter text-[1.15rem]
              leading-[1.6] font-semibold text-brand-bg
              transition-[background-color] duration-200
            "
            onClick={handleOpenQuiz}
          >
            START QUIZ
          </button>
        </div>
      )}
    </div>
  );
};

export default LessonView;
