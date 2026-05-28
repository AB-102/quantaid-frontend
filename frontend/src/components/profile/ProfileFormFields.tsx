import React from 'react';
import {
  highSchoolLevels,
  collegeLevels,
  subjects,
  codingExperienceOptions,
  hobbies,
} from '@/constants/formOptions';

interface ProfileFormFieldsProps {
  educationCategory: string;
  educationLevel: string;
  otherEducationLevel: string;
  subjectsStudied: string[];
  otherSubject: string;
  codingExperience: string;
  favoriteHobbies: string[];
  customHobbies: string;
  hobbyPersonalization: boolean;
  onEducationChange: (category: string, level: string, other: string) => void;
  onSubjectToggle: (subject: string) => void;
  onOtherSubjectChange: (value: string) => void;
  onCodingExperienceChange: (value: string) => void;
  onHobbyToggle: (hobby: string) => void;
  onCustomHobbiesChange: (value: string) => void;
  onHobbyPersonalizationToggle: () => void;
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  educationCategory,
  educationLevel,
  otherEducationLevel,
  subjectsStudied,
  otherSubject,
  codingExperience,
  favoriteHobbies,
  customHobbies,
  hobbyPersonalization,
  onEducationChange,
  onSubjectToggle,
  onOtherSubjectChange,
  onCodingExperienceChange,
  onHobbyToggle,
  onCustomHobbiesChange,
  onHobbyPersonalizationToggle,
}) => {
  return (
    <>
      {/* Education Level */}
      <div className="mb-7">
        <h3 className="
          mt-0 mb-1.5 font-inter text-[17px] font-medium text-white
        ">
          What is your education level?
          <span className="
            ml-1.5 cursor-help align-middle text-sm text-[#6B7280]
          " title="Helps us tailor content difficulty to your level">&#9432;</span>
        </h3>

        <h4 className="
          mt-3 mb-2 font-inter text-[13px] font-semibold tracking-wider
          text-brand-cool
        ">HIGH SCHOOL</h4>
        <div className="mb-1 flex flex-wrap gap-2.5">
          {highSchoolLevels.map(lvl => (
            <label
              key={lvl}
              className={`
                flex cursor-pointer items-center rounded-lg border-2 px-4 py-2.5
                font-inter text-sm whitespace-nowrap text-brand-cool
                transition-all duration-200
                ${(educationCategory === 'HighSchool' && educationLevel === lvl) ? `
                  border-[#1D4177] bg-brand-input-navy
                ` : `border-brand-border-b bg-transparent`}
              `}
            >
              <input
                type="radio"
                checked={educationCategory === 'HighSchool' && educationLevel === lvl}
                onChange={() => onEducationChange('HighSchool', lvl, '')}
                className="
                  relative mr-2.5 size-4 shrink-0 cursor-pointer appearance-none
                  rounded-full border-2 border-brand-cool bg-transparent
                  transition-all duration-200
                "
              />
              {lvl}
            </label>
          ))}
        </div>

        <h4 className="
          mt-3 mb-2 font-inter text-[13px] font-semibold tracking-wider
          text-brand-cool
        ">COLLEGE</h4>
        <div className="mb-1 flex flex-wrap gap-2.5">
          {collegeLevels.map(lvl => (
            <label
              key={lvl}
              className={`
                flex cursor-pointer items-center rounded-lg border-2 px-4 py-2.5
                font-inter text-sm whitespace-nowrap text-brand-cool
                transition-all duration-200
                ${(educationCategory === 'College' && educationLevel === lvl) ? `
                  border-[#1D4177] bg-brand-input-navy
                ` : `border-brand-border-b bg-transparent`}
              `}
            >
              <input
                type="radio"
                checked={educationCategory === 'College' && educationLevel === lvl}
                onChange={() => onEducationChange('College', lvl, '')}
                className="
                  relative mr-2.5 size-4 shrink-0 cursor-pointer appearance-none
                  rounded-full border-2 border-brand-cool bg-transparent
                  transition-all duration-200
                "
              />
              {lvl}
            </label>
          ))}
        </div>

        <div className="mb-1 flex flex-wrap gap-2.5">
          <label
            className={`
              flex cursor-pointer items-start rounded-lg border-2 px-4 py-3
              font-inter text-sm text-brand-cool transition-all duration-200
              ${educationCategory === 'Other' ? `
                border-[#1D4177] bg-brand-input-navy
              ` : `border-brand-border-b bg-transparent`}
            `}
          >
            <input
              type="radio"
              checked={educationCategory === 'Other'}
              onChange={() => onEducationChange('Other', '', otherEducationLevel)}
              className="
                relative mr-2.5 size-4 shrink-0 cursor-pointer appearance-none
                rounded-full border-2 border-brand-cool bg-transparent
                transition-all duration-200
              "
            />
            <div className="flex w-full flex-col gap-1.5">
              <span>Other (please specify)</span>
              {educationCategory === 'Other' && (
                <input
                  type="text"
                  placeholder="Type here..."
                  value={otherEducationLevel}
                  onChange={e => onEducationChange('Other', '', e.target.value)}
                  className="
                    w-full border-0 border-b-2 border-brand-border
                    bg-transparent px-0 py-1.5 font-inter text-sm text-white
                    transition-all duration-200 outline-none
                  "
                  autoFocus
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Subjects */}
      <div className="mb-7">
        <h3 className="
          mt-0 mb-1.5 font-inter text-[17px] font-medium text-white
        ">
          Subjects studied or experienced
          <span className="
            ml-1.5 cursor-help align-middle text-sm text-[#6B7280]
          " title="Helps us understand your background knowledge">&#9432;</span>
        </h3>
        <p className="mt-0 mb-3 font-inter text-[13px] text-brand-cool">(Select all that apply)</p>
        <div className="flex flex-col gap-2.5">
          {subjects.map(subj =>
            subj === 'Other (please specify)' ? (
              <label
                key={subj}
                className={`
                  flex cursor-pointer items-start rounded-lg border-2 px-4 py-3
                  font-inter text-sm text-brand-cool transition-all duration-200
                  ${subjectsStudied.includes(subj) ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="checkbox"
                  checked={subjectsStudied.includes(subj)}
                  onChange={() => onSubjectToggle(subj)}
                  className="
                    relative mr-2.5 size-4 shrink-0 cursor-pointer
                    appearance-none rounded-sm border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                <div className="flex w-full flex-col gap-1.5">
                  <span>Other (please specify)</span>
                  {subjectsStudied.includes(subj) && (
                    <input
                      type="text"
                      placeholder="Type here..."
                      value={otherSubject}
                      onChange={e => onOtherSubjectChange(e.target.value)}
                      className="
                        w-full border-0 border-b-2 border-brand-border
                        bg-transparent px-0 py-1.5 font-inter text-sm text-white
                        transition-all duration-200 outline-none
                      "
                      autoFocus
                    />
                  )}
                </div>
              </label>
            ) : (
              <label
                key={subj}
                className={`
                  flex cursor-pointer items-center rounded-lg border-2 px-4
                  py-2.5 font-inter text-sm text-brand-cool transition-all
                  duration-200
                  ${subjectsStudied.includes(subj) ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="checkbox"
                  checked={subjectsStudied.includes(subj)}
                  onChange={() => onSubjectToggle(subj)}
                  className="
                    relative mr-2.5 size-4 shrink-0 cursor-pointer
                    appearance-none rounded-sm border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                {subj}
              </label>
            )
          )}
        </div>
      </div>

      {/* Coding Experience */}
      <div className="mb-7">
        <h3 className="
          mt-0 mb-1.5 font-inter text-[17px] font-medium text-white
        ">
          How much coding experience do you have?
          <span className="
            ml-1.5 cursor-help align-middle text-sm text-[#6B7280]
          " title="Helps us adjust code examples and technical depth">&#9432;</span>
        </h3>
        <div className="mt-2">
          {codingExperienceOptions.map(opt => (
            <label
              key={opt}
              className={`
                mb-2 flex cursor-pointer items-center rounded-lg border-2 px-4
                py-2.5 font-inter text-sm text-brand-cool transition-all
                duration-200
                ${codingExperience === opt ? `
                  border-[#1D4177] bg-brand-input-navy
                ` : `border-brand-border-b bg-transparent`}
              `}
            >
              <input
                type="radio"
                checked={codingExperience === opt}
                onChange={() => onCodingExperienceChange(opt)}
                className="
                  relative mr-2.5 size-4 shrink-0 cursor-pointer appearance-none
                  rounded-full border-2 border-brand-cool bg-transparent
                  transition-all duration-200
                "
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {/* Hobbies */}
      <div className="mb-7">
        <h3 className="
          mt-0 mb-1.5 font-inter text-[17px] font-medium text-white
        ">
          Your hobbies &amp; interests
          <span className="
            ml-1.5 cursor-help align-middle text-sm text-[#6B7280]
          " title="Listed hobbies can influence the personalization of your AI responses when the toggle below is enabled">&#9432;</span>
        </h3>
        <p className="mt-0 mb-3 font-inter text-[13px] text-brand-cool">(Select all that apply)</p>
        <div className="flex flex-wrap gap-2.5">
          {hobbies.map(h => (
            <button
              key={h}
              onClick={() => onHobbyToggle(h)}
              className={`
                cursor-pointer rounded-lg border-2 bg-transparent px-4.5 py-2
                font-inter text-sm transition-all duration-200
                ${favoriteHobbies.includes(h) ? `
                  border-[#1D4177] bg-brand-input-navy text-white
                ` : `border-brand-border-b text-brand-cool`}
              `}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="mt-2 flex w-full flex-col items-center">
          <p className="my-3 font-inter text-[13px] text-brand-cool">Want to be more specific? Add your own</p>
          <input
            type="text"
            placeholder="(e.g. violin, bird watching, spoken word poetry)"
            value={customHobbies}
            onChange={e => onCustomHobbiesChange(e.target.value)}
            className="
              w-full rounded-lg border-2 border-brand-border bg-transparent px-0
              py-2.5 text-center font-inter text-sm text-white transition-all
              duration-200 outline-none
            "
          />
        </div>

        {/* Personalization toggle */}
        <div className="mt-5">
          <h3 className="
            mt-0 mb-1.5 font-inter text-[17px] font-medium text-white
          ">
            Allow hobby personalization
            <span className="
              ml-1.5 cursor-help align-middle text-sm text-[#6B7280]
            " title="AI responses will use your hobbies to create relatable analogies">&#9432;</span>
          </h3>
          <label className="
            mt-1.5 flex cursor-pointer items-center justify-between
          ">
            <span className="font-inter text-[13px] text-brand-cool">
              {hobbyPersonalization ? 'Enabled — AI uses your hobbies for analogies' : 'Disabled — AI uses generic examples'}
            </span>
            <button
              type="button"
              aria-pressed={hobbyPersonalization}
              onClick={onHobbyPersonalizationToggle}
              className="
                relative h-6 w-10.5 shrink-0 cursor-pointer rounded-xl
                transition-[background-color] duration-200
              "
              style={{ backgroundColor: hobbyPersonalization ? '#3B89FF' : '#434F62' }}
            >
              <div
                className="
                  absolute top-0.75 left-0.75 size-4.5 rounded-full bg-white
                  transition-[transform] duration-200
                "
                style={{ transform: hobbyPersonalization ? 'translateX(18px)' : 'translateX(0)' }}
              />
            </button>
          </label>
        </div>
      </div>
    </>
  );
};

export default ProfileFormFields;
