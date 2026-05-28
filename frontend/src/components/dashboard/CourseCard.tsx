import type { Course } from '@/types/course';
import React from 'react';
import { FaLock } from 'react-icons/fa';

interface CourseCardProps {
  course: Course;
  isUnlocked: boolean;
  progress: number;
  onSelect: (courseId: number) => void;
  cardRef: (courseId: number, el: HTMLElement | null) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isUnlocked, progress, onSelect, cardRef }) => {
  return (
    <div
      key={course.id}
      ref={(el) => cardRef(course.id, el)}
      role="button"
      tabIndex={isUnlocked ? 0 : -1}
      className={`
        relative flex h-90 w-full max-w-75 min-w-75 shrink-0 flex-col
        overflow-hidden rounded-[10px] border border-brand-border bg-brand-card
        transition-shadow duration-200 will-change-transform backface-hidden
        transform-3d
        ${isUnlocked ? `cursor-pointer` : `cursor-not-allowed opacity-50`}
      `}
      onClick={() => isUnlocked && onSelect(course.id)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isUnlocked) {
          e.preventDefault();
          onSelect(course.id);
        }
      }}
      aria-label={`${course.title}. ${isUnlocked ? progress > 0 ? `${progress}% complete` : 'Not started' : 'Locked'}`}
      aria-disabled={!isUnlocked}
    >
      <img
        src={course.image}
        alt={course.title}
        className="
          mx-3 mt-3 block h-36 max-h-36 min-h-36 w-[calc(100%-24px)] shrink-0
          rounded-lg object-contain
        "
      />
      <div className="
        relative flex h-[calc(360px-144px-24px)] max-h-[calc(360px-144px-24px)]
        min-h-[calc(360px-144px-24px)] flex-1 flex-col overflow-hidden p-5
      ">
        <h4 className="
          m-0 mb-2.5 line-clamp-2 h-13 max-h-13 min-h-6.5 items-start
          justify-start font-inter text-[1.25rem] leading-[1.3] font-semibold
          text-white
        ">
          {course.title}
        </h4>
        <p className="
          m-0 mb-3.75 line-clamp-3 h-18 max-h-18 min-h-18 font-inter
          text-[0.9rem] leading-normal font-normal text-brand-gray-dim
        ">
          {course.description}
        </p>
        {isUnlocked && progress > 0 && (
          <div className="
            absolute inset-x-5 bottom-1.25 flex h-6.25 shrink-0 items-center
            gap-3
          ">
            <div className="
              relative h-2 w-[65%] flex-1 shrink-0 overflow-hidden rounded-sm
              bg-brand-border
            ">
              <div
                className="
                  h-full rounded-sm bg-brand-blue transition-[width]
                  duration-500 ease-in-out
                "
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="
              min-w-fit shrink-0 font-inter text-[0.75rem] leading-none
              font-normal whitespace-nowrap text-white
            ">
              {progress}% complete
            </span>
          </div>
        )}
      </div>
      {!isUnlocked && (
        <div className="
          absolute inset-x-0 bottom-0 flex h-20 max-h-20 min-h-20 shrink-0
          items-end justify-center bg-linear-to-t from-black/80 via-black/60
          to-transparent pb-3.75
        ">
          <div className="
            flex shrink-0 items-center justify-center bg-transparent
            text-[1.2rem] text-brand-gray-mid
          ">
            <FaLock />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
