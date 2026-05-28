import React from 'react';

import {
  whereHeardOptions,
  highSchoolLevels,
  collegeLevels,
  subjects,
  codingExperienceOptions,
  hobbies,
} from '@/constants/formOptions';

export interface FormData {
  whereHeard: string[];
  otherWhereHeard: string;
  educationCategory: string;
  educationLevel: string;
  otherEducationLevel: string;
  subjects: string[];
  otherSubject: string;
  codingExperience: string;
  favoriteHobbies: string[];
  customHobbies: string;
}

export interface StepConfig {
  title: string;
  subtitle?: string;
  hasSelection: (formData: FormData) => boolean;
  renderContent: (formData: FormData, handlers: FormHandlers) => React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  customRender?: (
    stepConfig: StepConfig,
    formData: FormData,
    handlers: FormHandlers,
    commonProps: CommonProps
  ) => React.ReactNode;
}

export interface FormHandlers {
  handleWhereHeardChange: (option: string) => void;
  handleSubjectsChange: (subj: string) => void;
  handleHobbyToggle: (hobby: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export interface CommonProps {
  step: number;
  setStep: (step: number) => void;
  totalSteps: number;
  skipOnboarding: () => void;
  handleSubmit: () => void;
}

export const stepConfigs: StepConfig[] = [
  {
    title: "Where did you hear about us?",
    subtitle: "(Select all that apply)",
    isFirst: true,
    hasSelection: (formData) => {
      const nonOtherSelections = formData.whereHeard.filter(item => item !== 'Other (please specify)');
      const hasValidOther = formData.whereHeard.includes('Other (please specify)') && formData.otherWhereHeard.trim() !== '';
      return nonOtherSelections.length > 0 || hasValidOther;
    },
    renderContent: (formData, handlers) => (
      <>
        <div className="mb-6 flex w-full max-w-150 flex-col gap-4">
          {whereHeardOptions.map((option) => (
            option === 'Other (please specify)' ? (
              <label
                key={option}
                className={`
                  flex min-h-15 min-w-100 cursor-pointer items-start rounded-lg
                  border-2 px-6 py-4 text-left font-inter text-lg
                  text-brand-cool transition-all duration-200
                  ${formData.whereHeard.includes(option) ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="checkbox"
                  checked={formData.whereHeard.includes(option)}
                  onChange={() => handlers.handleWhereHeardChange(option)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlers.handleWhereHeardChange(option); } }}
                  className="
                    relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                    appearance-none rounded-sm border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                <div className="flex w-full flex-col gap-2">
                  <span>Other (please specify)</span>
                  {formData.whereHeard.includes(option) && (
                    <input
                      type="text"
                      placeholder="Type here..."
                      value={formData.otherWhereHeard}
                      onChange={(e) =>
                        handlers.setFormData(prev => ({ ...prev, otherWhereHeard: e.target.value }))
                      }
                      className="
                        w-full border-0 border-b-2 border-brand-border
                        bg-transparent px-0 py-2 font-inter text-base text-white
                        transition-all duration-200 outline-none
                      "
                      autoFocus
                    />
                  )}
                </div>
              </label>
            ) : (
              <label
                key={option}
                className={`
                  flex min-w-100 cursor-pointer items-center rounded-lg border-2
                  px-6 py-3.5 text-left font-inter text-lg text-brand-cool
                  transition-all duration-200
                  ${formData.whereHeard.includes(option) ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="checkbox"
                  checked={formData.whereHeard.includes(option)}
                  onChange={() => handlers.handleWhereHeardChange(option)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlers.handleWhereHeardChange(option); } }}
                  className="
                    relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                    appearance-none rounded-sm border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                {option}
              </label>
            )
          ))}
        </div>
      </>
    )
  },
  {
    title: "What is your education level?",
    hasSelection: (formData) =>
      formData.educationCategory !== '' &&
      (formData.educationLevel !== '' || formData.otherEducationLevel !== ''),
    renderContent: (formData, handlers) => (
      <>
        <div className="flex w-full max-w-200 flex-col items-start gap-8">
          {/* HIGH SCHOOL Section */}
          <div className="flex w-full flex-col items-start gap-4">
            <h4 className="
              mb-4 font-inter text-[1.3rem] font-semibold text-white
            ">HIGH SCHOOL</h4>
            <div className="flex flex-row flex-wrap gap-3">
              {highSchoolLevels.map((lvl) => (
                <label
                  key={lvl}
                  className={`
                    flex min-w-fit cursor-pointer items-center rounded-lg
                    border-2 px-5 py-3 text-left font-inter text-base
                    whitespace-nowrap text-brand-cool transition-all
                    duration-200
                    ${(formData.educationCategory === 'HighSchool' && formData.educationLevel === lvl) ? `
                      border-[#1D4177] bg-brand-input-navy
                    ` : `border-brand-border-b bg-transparent`}
                  `}
                >
                  <input
                    type="radio"
                    checked={formData.educationCategory === 'HighSchool' && formData.educationLevel === lvl}
                    onChange={() =>
                      handlers.setFormData(prev => ({
                        ...prev,
                        educationCategory: 'HighSchool',
                        educationLevel: lvl,
                        otherEducationLevel: '',
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlers.setFormData(prev => ({
                          ...prev,
                          educationCategory: 'HighSchool',
                          educationLevel: lvl,
                          otherEducationLevel: '',
                        }));
                      }
                    }}
                    className="
                      relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                      appearance-none rounded-full border-2 border-brand-cool
                      bg-transparent transition-all duration-200
                    "
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>

          {/* COLLEGE Section */}
          <div className="flex w-full flex-col items-start gap-4">
            <h4 className="
              mb-4 font-inter text-[1.3rem] font-semibold text-white
            ">COLLEGE</h4>
            <div className="flex flex-row flex-wrap gap-3">
              {collegeLevels.map((lvl) => (
                <label
                  key={lvl}
                  className={`
                    flex min-w-fit cursor-pointer items-center rounded-lg
                    border-2 px-5 py-3 text-left font-inter text-base
                    whitespace-nowrap text-brand-cool transition-all
                    duration-200
                    ${(formData.educationCategory === 'College' && formData.educationLevel === lvl) ? `
                      border-[#1D4177] bg-brand-input-navy
                    ` : `border-brand-border-b bg-transparent`}
                  `}
                >
                  <input
                    type="radio"
                    checked={formData.educationCategory === 'College' && formData.educationLevel === lvl}
                    onChange={() =>
                      handlers.setFormData(prev => ({
                        ...prev,
                        educationCategory: 'College',
                        educationLevel: lvl,
                        otherEducationLevel: '',
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlers.setFormData(prev => ({
                          ...prev,
                          educationCategory: 'College',
                          educationLevel: lvl,
                          otherEducationLevel: '',
                        }));
                      }
                    }}
                    className="
                      relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                      appearance-none rounded-full border-2 border-brand-cool
                      bg-transparent transition-all duration-200
                    "
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-4">
            <h4 className="
              mb-4 font-inter text-[1.3rem] font-semibold text-white
            "></h4>
            <div className="flex flex-row flex-wrap gap-3">
              <label
                className={`
                  flex min-h-15 min-w-75 cursor-pointer items-start rounded-lg
                  border-2 px-5 py-4 text-left font-inter text-base
                  text-brand-cool transition-all duration-200
                  ${formData.educationCategory === 'Other' ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="radio"
                  checked={formData.educationCategory === 'Other'}
                  onChange={() =>
                    handlers.setFormData(prev => ({
                      ...prev,
                      educationCategory: 'Other',
                      educationLevel: '',
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlers.setFormData(prev => ({
                        ...prev,
                        educationCategory: 'Other',
                        educationLevel: '',
                      }));
                    }
                  }}
                  className="
                    relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                    appearance-none rounded-full border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                <div className="flex w-full flex-col gap-2">
                  <span>Other (please specify)</span>
                  {formData.educationCategory === 'Other' && (
                    <input
                      type="text"
                      placeholder="Type here..."
                      value={formData.otherEducationLevel}
                      onChange={(e) =>
                        handlers.setFormData(prev => ({ ...prev, otherEducationLevel: e.target.value }))
                      }
                      className="
                        w-full border-0 border-b-2 border-brand-border
                        bg-transparent px-0 py-2 font-inter text-base text-white
                        transition-all duration-200 outline-none
                      "
                      autoFocus
                    />
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      </>
    )
  },
  {
    title: "Which subjects have you studied or have experience in?",
    subtitle: "(Select all that apply)",
    hasSelection: (formData) => {
      const nonOtherSelections = formData.subjects.filter(item => item !== 'Other (please specify)');
      const hasValidOther = formData.subjects.includes('Other (please specify)') && formData.otherSubject.trim() !== '';
      return nonOtherSelections.length > 0 || hasValidOther;
    },
    renderContent: (formData, handlers) => (
      <>
        <div className="mb-6 flex w-full max-w-150 flex-col gap-4">
          {subjects.map((subj) => (
            subj === 'Other (please specify)' ? (
              <label
                key={subj}
                className={`
                  flex min-h-15 min-w-100 cursor-pointer items-start rounded-lg
                  border-2 px-6 py-4 text-left font-inter text-lg
                  text-brand-cool transition-all duration-200
                  ${formData.subjects.includes(subj) ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subj)}
                  onChange={() => handlers.handleSubjectsChange(subj)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlers.handleSubjectsChange(subj); } }}
                  className="
                    relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                    appearance-none rounded-sm border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                <div className="flex w-full flex-col gap-2">
                  <span>Other (please specify):</span>
                  {formData.subjects.includes(subj) && (
                    <input
                      type="text"
                      placeholder="Type here..."
                      value={formData.otherSubject}
                      onChange={(e) =>
                        handlers.setFormData(prev => ({ ...prev, otherSubject: e.target.value }))
                      }
                      className="
                        w-full border-0 border-b-2 border-brand-border
                        bg-transparent px-0 py-2 font-inter text-base text-white
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
                  flex min-w-100 cursor-pointer items-center rounded-lg border-2
                  px-6 py-3.5 text-left font-inter text-lg text-brand-cool
                  transition-all duration-200
                  ${formData.subjects.includes(subj) ? `
                    border-[#1D4177] bg-brand-input-navy
                  ` : `border-brand-border-b bg-transparent`}
                `}
              >
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subj)}
                  onChange={() => handlers.handleSubjectsChange(subj)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlers.handleSubjectsChange(subj); } }}
                  className="
                    relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                    appearance-none rounded-sm border-2 border-brand-cool
                    bg-transparent transition-all duration-200
                  "
                />
                {subj}
              </label>
            )
          ))}
        </div>
      </>
    )
  },
  {
    title: "How much coding experience do you have?",
    hasSelection: (formData) => formData.codingExperience !== '',
    renderContent: (formData, handlers) => (
      <div className="mb-8 w-full max-w-150">
        {codingExperienceOptions.map((option) => (
          <label
            key={option}
            className={`
              mb-4 flex min-w-100 cursor-pointer items-center rounded-lg
              border-2 px-6 py-3.5 text-left font-inter text-lg text-brand-cool
              transition-all duration-200
              ${formData.codingExperience === option ? `
                border-[#1D4177] bg-brand-input-navy
              ` : `border-brand-border-b bg-transparent`}
            `}
          >
            <input
              type="radio"
              name="codingExperience"
              checked={formData.codingExperience === option}
              onChange={() =>
                handlers.setFormData(prev => ({ ...prev, codingExperience: option }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlers.setFormData(prev => ({ ...prev, codingExperience: option }));
                }
              }}
              className="
                relative mr-4 -ml-2.5 size-5 shrink-0 cursor-pointer
                appearance-none rounded-full border-2 border-brand-cool
                bg-transparent transition-all duration-200
              "
            />
            {option}
          </label>
        ))}
      </div>
    )
  },
  {
    title: "Select your favourite hobbies and interests",
    subtitle: "(Select all that apply)",
    isLast: true,
    hasSelection: (formData) => formData.favoriteHobbies.length > 0 || formData.customHobbies.trim() !== '',
    renderContent: (formData, handlers) => (
      <div className="mb-8 flex w-full max-w-175 flex-col items-center">
        <div className="mb-8 flex max-w-175 flex-wrap justify-center gap-4">
          {hobbies.map((hobby) => (
            <button
              key={hobby}
              className={`
                hobby-button min-w-30 cursor-pointer rounded-lg border-2
                bg-transparent px-6 py-3.5 text-center font-inter text-base
                transition-all duration-200
                ${formData.favoriteHobbies.includes(hobby) ? `
                  border-[#1D4177] bg-brand-input-navy text-white
                ` : `border-brand-border text-brand-cool`}
              `}
              onClick={() => handlers.handleHobbyToggle(hobby)}
            >
              {hobby}
            </button>
          ))}
        </div>

        {/* Custom hobbies section */}
        <div className="flex w-full max-w-125 flex-col items-center gap-2">
          <h3 className="
            mx-auto w-full text-center font-inter text-[34px] leading-relaxed
            font-normal tracking-[.02em] text-white
          ">Want to be more specific?</h3>
          <p className="text-center font-inter text-[1.2rem] text-white">Add your own</p>
          <input
            type="text"
            placeholder="(e.g. violin, bird watching, spoken word poetry)"
            value={formData.customHobbies}
            onChange={(e) =>
              handlers.setFormData(prev => ({ ...prev, customHobbies: e.target.value }))
            }
            className="
              w-full rounded-lg border-2 border-brand-border bg-transparent px-0
              py-3.5 text-center font-inter text-base text-white transition-all
              duration-200 outline-none
            "
          />
        </div>
      </div>
    )
  }
];
