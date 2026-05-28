// src/components/Profile.tsx — Profile Settings Modal

import React, { useEffect, useRef, useState, useCallback, ChangeEvent } from 'react';
import { IoMdClose } from 'react-icons/io';
import api, { BACKEND_URL } from '@/api';
import { highSchoolLevels, collegeLevels, subjects } from '@/constants/formOptions';
import ProfilePictureUpload from './ProfilePictureUpload';
import ProfileFormFields from './ProfileFormFields';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userPicture?: string;
}

interface ProfileData {
  name: string;
  profilePicture: string;
  educationCategory: string;
  educationLevel: string;
  otherEducationLevel: string;
  subjectsStudied: string[];
  otherSubject: string;
  codingExperience: string;
  favoriteHobbies: string[];
  customHobbies: string;
  hobbyPersonalization: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userName: propName, userPicture: propPicture }) => {
  const [data, setData] = useState<ProfileData>({
    name: '',
    profilePicture: '',
    educationCategory: '',
    educationLevel: '',
    otherEducationLevel: '',
    subjectsStudied: [],
    otherSubject: '',
    codingExperience: '',
    favoriteHobbies: [],
    customHobbies: '',
    hobbyPersonalization: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    void api
      .get('/get_user_profile')
      .then(res => {
        const d = res.data;
        // Parse education: educationLevel is stored as "High School - 10th Grade" or "College - Sophomore" etc
        let eduCategory = d.educationCategory || '';
        let eduLevel = '';
        let otherEdu = '';

        if (eduCategory === 'HighSchool' || eduCategory === 'College' || eduCategory === 'Other') {
          // educationLevel from backend is the processed string like "High School - 10th Grade"
          const rawEdu = d.educationLevel || '';
          if (rawEdu.startsWith('High School - ')) {
            eduCategory = 'HighSchool';
            eduLevel = rawEdu.replace('High School - ', '');
          } else if (rawEdu.startsWith('College - ')) {
            eduCategory = 'College';
            eduLevel = rawEdu.replace('College - ', '');
          } else if (eduCategory === 'Other') {
            otherEdu = rawEdu;
          }
        } else if (d.educationLevel) {
          // Fallback: try to parse from the processed string
          const rawEdu = d.educationLevel;
          if (rawEdu.startsWith('High School - ')) {
            eduCategory = 'HighSchool';
            eduLevel = rawEdu.replace('High School - ', '');
          } else if (rawEdu.startsWith('College - ')) {
            eduCategory = 'College';
            eduLevel = rawEdu.replace('College - ', '');
          } else if (highSchoolLevels.includes(rawEdu)) {
            eduCategory = 'HighSchool';
            eduLevel = rawEdu;
          } else if (collegeLevels.includes(rawEdu)) {
            eduCategory = 'College';
            eduLevel = rawEdu;
          } else if (rawEdu && rawEdu !== 'Not provided') {
            eduCategory = 'Other';
            otherEdu = rawEdu;
          }
        }

        // Parse subjects: separate "Other" entries from known subjects
        const rawSubjects: string[] = d.subjectsStudied || [];
        const knownSubjectNames = subjects.filter(s => s !== 'Other (please specify)');
        const known: string[] = [];
        let otherSubj = '';
        for (const s of rawSubjects) {
          if (knownSubjectNames.includes(s)) {
            known.push(s);
          } else {
            otherSubj = s;
          }
        }
        const subjectsList = [...known];
        if (otherSubj) {
          subjectsList.push('Other (please specify)');
        }

        setData({
          name: d.name || '',
          profilePicture: d.profilePicture || '',
          educationCategory: eduCategory,
          educationLevel: eduLevel,
          otherEducationLevel: otherEdu,
          subjectsStudied: subjectsList,
          otherSubject: otherSubj,
          codingExperience: d.codingExperience || '',
          favoriteHobbies: d.favoriteHobbies || [],
          customHobbies: d.customHobbies || '',
          hobbyPersonalization: d.hobbyPersonalization !== false,
        });
      })
      .catch(() => { /* Profile may not be complete yet */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setSaveMessage('');
    }
  }, [isOpen, fetchProfile]);

  // Focus trap + Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const getFocusable = () =>
      modalElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Focus the close button on open
    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  const handlePicture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('picture', file);
    void api
      .post('/save_profile_picture', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(res => setData(d => ({ ...d, profilePicture: res.data.url })))
      .catch((err: unknown) => { console.error(err); });
  };

  const handleSubjectToggle = (subj: string) => {
    setData(d => {
      const current = d.subjectsStudied;
      if (current.includes(subj)) {
        return { ...d, subjectsStudied: current.filter(s => s !== subj) };
      }
      return { ...d, subjectsStudied: [...current, subj] };
    });
  };

  const handleHobbyToggle = (hobby: string) => {
    setData(d => {
      const current = d.favoriteHobbies;
      if (current.includes(hobby)) {
        return { ...d, favoriteHobbies: current.filter(h => h !== hobby) };
      }
      return { ...d, favoriteHobbies: [...current, hobby] };
    });
  };

  const handleSave = () => {
    setSaving(true);
    setSaveMessage('');
    void api
      .post(
        '/save_profile',
        {
          educationCategory: data.educationCategory,
          educationLevel: data.educationLevel,
          otherEducationLevel: data.otherEducationLevel,
          subjects: data.subjectsStudied,
          otherSubject: data.otherSubject,
          codingExperience: data.codingExperience,
          favoriteHobbies: data.favoriteHobbies,
          customHobbies: data.customHobbies,
          hobbyPersonalization: data.hobbyPersonalization,
        },
      )
      .then(() => setSaveMessage('Profile saved!'))
      .catch(() => setSaveMessage('Save failed. Please try again.'))
      .finally(() => setSaving(false));
  };

  if (!isOpen) return null;

  const displayNameRaw = data.name || propName || '';
  const firstName = displayNameRaw ? displayNameRaw.split(' ')[0] : 'User';
  const rawPic = data.profilePicture || propPicture || '';
  const picSrc = rawPic
    ? (rawPic.startsWith('http') ? rawPic : `${BACKEND_URL}${rawPic}`)
    : '';

  return (
    <div className="
      fixed inset-0 z-9999 flex items-center justify-center bg-black/60
    " onClick={onClose}>
      <div
        ref={modalRef}
        className="
          relative flex max-h-[85vh] w-150 max-w-[90vw] flex-col overflow-hidden
          rounded-2xl bg-brand-navy shadow-[0_15px_30px_rgba(0,0,0,0.5)]
        "
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profile settings"
      >
        {/* Close button */}
        <button onClick={onClose} className="
          absolute top-4 right-4 z-10 flex cursor-pointer items-center
          justify-center border-none bg-transparent p-1
        " aria-label="Close">
          <IoMdClose size={22} color="#AAAAC1" />
        </button>

        {loading ? (
          <div className="p-10 text-center text-brand-cool">Loading...</div>
        ) : (
          <div className="overflow-y-auto px-9 py-8">
            {/* Header: Avatar + Greeting */}
            <ProfilePictureUpload
              picSrc={picSrc}
              firstName={firstName}
              onPictureChange={handlePicture}
            />

            <h2 className="
              mt-2 mb-7 text-center font-inter text-2xl font-normal
              tracking-[.02em] text-white
            ">Welcome back, {firstName}!</h2>

            <ProfileFormFields
              educationCategory={data.educationCategory}
              educationLevel={data.educationLevel}
              otherEducationLevel={data.otherEducationLevel}
              subjectsStudied={data.subjectsStudied}
              otherSubject={data.otherSubject}
              codingExperience={data.codingExperience}
              favoriteHobbies={data.favoriteHobbies}
              customHobbies={data.customHobbies}
              hobbyPersonalization={data.hobbyPersonalization}
              onEducationChange={(cat, lvl, other) => setData(d => ({ ...d, educationCategory: cat, educationLevel: lvl, otherEducationLevel: other }))}
              onSubjectToggle={handleSubjectToggle}
              onOtherSubjectChange={(val) => setData(d => ({ ...d, otherSubject: val }))}
              onCodingExperienceChange={(opt) => setData(d => ({ ...d, codingExperience: opt }))}
              onHobbyToggle={handleHobbyToggle}
              onCustomHobbiesChange={(val) => setData(d => ({ ...d, customHobbies: val }))}
              onHobbyPersonalizationToggle={() => setData(d => ({ ...d, hobbyPersonalization: !d.hobbyPersonalization }))}
            />

            {/* Save */}
            <div className="mt-2 flex flex-col items-center pb-2">
              <button onClick={handleSave} disabled={saving} className="
                cursor-pointer rounded-xl border-none bg-brand-deep px-10 py-3
                font-inter text-base font-medium text-white transition-all
                duration-200
              ">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMessage && (
                <p
                  className="mt-2.5 font-inter text-sm"
                  style={{ color: saveMessage.includes('failed') ? '#ff6b6b' : '#4ade80' }}
                >
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
