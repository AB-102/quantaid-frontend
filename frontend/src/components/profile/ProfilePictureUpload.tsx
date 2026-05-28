import React, { ChangeEvent } from 'react';

interface ProfilePictureUploadProps {
  picSrc: string;
  firstName: string;
  onPictureChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  picSrc,
  firstName,
  onPictureChange,
}) => {
  return (
    <div className="mb-2 flex flex-col items-center">
      {picSrc ? (
        <img src={picSrc} alt="Profile" className="
          size-25 rounded-full border-[3px] border-brand-border object-cover
        " />
      ) : (
        <div className="
          flex size-25 items-center justify-center rounded-full border-[3px]
          border-brand-border bg-brand-input-navy font-inter text-[36px]
          font-semibold text-brand-cool
        ">
          {firstName.charAt(0).toUpperCase()}
        </div>
      )}
      <label className="
        mt-2.5 cursor-pointer rounded-lg border border-brand-border
        bg-transparent px-4 py-1.5 font-inter text-[13px] text-brand-cool
        transition-all duration-200
      ">
        Change Photo
        <input
          type="file"
          accept="image/*"
          onChange={onPictureChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default ProfilePictureUpload;
