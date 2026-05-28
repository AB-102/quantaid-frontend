import type { CompletedQuiz, Course } from '@/types/course';
import React from 'react';
import { FaCheckCircle, FaLock } from 'react-icons/fa';

interface CourseDetailViewProps {
  currentCourse: number | null;
  activeCourses: Course[];
  completedQuizzes: CompletedQuiz[];
  isTopicUnlocked: (topicId: number) => boolean;
  openLesson: (topicId: number) => void;
  renderBreadcrumb: () => React.ReactNode;
}

const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  currentCourse,
  activeCourses,
  completedQuizzes,
  isTopicUnlocked,
  openLesson,
  renderBreadcrumb,
}) => {
  if (currentCourse === null) return <p>Loading course...</p>;
  const course = activeCourses.find(c => c.id === currentCourse);
  if (!course) return <p>Course not found.</p>;

  return (
    <div className="mx-auto max-w-250 py-5">
      {renderBreadcrumb()}

      <div className="mb-15 text-left">
        <h1 className="
          mb-3.75 cursor-text font-inter text-[36px] font-medium text-white
        ">{course.title}</h1>
        <p className="
          m-0 cursor-text font-inter text-base leading-[1.6] text-[#F5F5FB]
        ">{course.description}</p>
      </div>

      <div className="flex flex-col gap-10">
        {course.concepts.map((concept, conceptIndex) => (
          <div key={concept.id}>
            <div className="mb-6.25 flex items-center gap-3.5">
              <div className="
                mt-2.5 flex size-8.75 shrink-0 cursor-default items-center
                justify-center rounded-full bg-brand-blue
              ">
                {concept.icon ? (
                  <img src={concept.icon} alt={concept.title} className="size-5" />
                ) : (
                  <span className="
                    font-inter text-[24px] font-bold text-brand-bg
                  ">{conceptIndex + 1}</span>
                )}
              </div>
              <h3 className="
                mt-2 flex-1 cursor-text font-inter text-[24px] leading-none
                font-medium text-white
              ">{concept.title}</h3>
            </div>

            <div className="flex flex-col gap-3">
              {concept.topics.map((topic) => {
                const isTopicCompleted = completedQuizzes.some(quiz => quiz.courseId === topic.id && quiz.passed);
                const isUnlocked = isTopicUnlocked(topic.id);

                return (
                  <button
                    className="
                      topic-button mb-2.5 flex w-full items-center
                      justify-between rounded-lg border-2 border-brand-border
                      bg-transparent px-5 py-4 font-inter transition-all
                      duration-200
                    "
                    key={topic.id}
                    style={!isUnlocked ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                    onClick={() => isUnlocked && openLesson(topic.id)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && isUnlocked) {
                        e.preventDefault();
                        openLesson(topic.id);
                      }
                    }}
                    disabled={!isUnlocked}
                    aria-label={`${topic.title}. ${isTopicCompleted ? 'Completed' : isUnlocked ? 'Available' : 'Locked'}`}
                    aria-disabled={!isUnlocked}
                  >
                    <span className="
                      flex-1 text-left text-base font-normal text-white
                    ">{topic.title}</span>
                    {isTopicCompleted && (
                      <FaCheckCircle size={24} className="text-brand-blue" />
                    )}
                    {!isUnlocked && (
                      <FaLock size={24} className="text-brand-gray-mid" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseDetailView;
