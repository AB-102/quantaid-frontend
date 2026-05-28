// src/components/Sidebar.tsx

import { BACKEND_URL } from '@/api';
import QuantaidLogoQ from '@/assets/quantaid-logo-q.svg';
import QuantaidLogoUantaid from '@/assets/quantaid-logo-uantaid.svg';
import React from 'react';
import { HiUserCircle } from "react-icons/hi2";
import { MdHelpOutline, MdKeyboardArrowUp, MdOutlineSettings, MdOutlineThumbsUpDown } from "react-icons/md";
import { PiSignOutBold } from "react-icons/pi";
import { TfiBookmarkAlt } from "react-icons/tfi";

interface SidebarProps {
  currentView: 'dashboard' | 'course-detail' | 'lesson';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateToDashboard: () => void;
  onCollapsedProfileClick: () => void;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  profileDropdownRef: React.RefObject<HTMLDivElement>;
  profileButtonRef: React.RefObject<HTMLButtonElement>;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onSignOutClick: () => void;
  onLeaveFeedbackClick: () => void;
  chatWidth: number;
  screenWidth: number;
  animationDuration: number;
  animationEasing: string;
  userEmail: string;
  userName: string;
  userPicture: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView: _currentView,
  isCollapsed,
  onNavigateToDashboard,
  onCollapsedProfileClick,
  showProfileDropdown,
  setShowProfileDropdown,
  profileDropdownRef,
  profileButtonRef,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onSignOutClick,
  onLeaveFeedbackClick,
  animationDuration,
  animationEasing,
  userEmail,
  userName,
  userPicture,
}) => {

  const profilePicSrc = userPicture
    ? (userPicture.startsWith('http') ? userPicture : `${BACKEND_URL}${userPicture}`)
    : '';
  const displayName = userName || 'Profile';

  const handleLeaveFeedbackClick = () => {
    onLeaveFeedbackClick();
  };

  const toggleProfileDropdown = () => {
    if (isCollapsed) {
      onCollapsedProfileClick();
    } else {
      setShowProfileDropdown(!showProfileDropdown);
    }
  };

  const SIDEBAR_EXPANDED_WIDTH = 250;
  const SIDEBAR_COLLAPSED_WIDTH = 70;
  const currentWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
  const dur = `${animationDuration}ms`;
  const ease = animationEasing;

  // Text span: hides by opacity/width when collapsed
  const textStyle = (extraStyle?: React.CSSProperties): React.CSSProperties => ({
    opacity: isCollapsed ? 0 : 1,
    width: isCollapsed ? '0px' : 'auto',
    transition: `opacity ${animationDuration * 0.6}ms ${ease}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'clip',
    minWidth: 0,
    ...extraStyle,
  });

  return (
    <aside
      className="
        sidebar-coordinated fixed z-100 flex h-screen shrink-0 flex-col
        justify-between overflow-clip border-r border-brand-border
        bg-transparent py-5
      "
      style={{ width: currentWidth, transition: `width ${dur} ${ease}` }}
    >
      <div>
        {/* Q & uantaid Logo SVGs */}
        <div
          className="
            box-border flex min-h-9.5 min-w-10 items-center overflow-hidden py-3
          "
          style={{
            margin: isCollapsed ? '0 auto' : '0 20px',
            marginLeft: isCollapsed ? '15px' : '3rem',
            transition: `all ${dur} ${ease}`,
          }}
          aria-label="Quantaid Logo"
        >
          <div
            className="block shrink-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${QuantaidLogoQ})`,
              width: '40px',
              height: '40px',
              transition: `all ${dur} ${ease}`,
            }}
          />
          <div
            className="
              bg-left-center block shrink-0 bg-size-[auto_100%] bg-no-repeat
            "
            style={{
              backgroundImage: `url(${QuantaidLogoUantaid})`,
              width: isCollapsed ? '0px' : '100px',
              height: '38px',
              opacity: isCollapsed ? 0 : 1,
              overflow: 'hidden',
              transition: `all ${dur} ${ease}`,
            }}
          />
        </div>

        <nav
          className="mt-10 flex flex-1 flex-col overflow-visible pb-5"
          style={{
            padding: isCollapsed ? '0 10px' : '0 20px',
            transition: `padding ${dur} ${ease}`,
          }}
        >
          <button
            className="
              nav-button nav-button-active mb-1 flex w-full cursor-pointer
              items-center overflow-clip rounded-lg border-none bg-brand-bg
              text-left font-inter text-lg font-medium text-brand-gray
            "
            style={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '12px' : '12px 16px',
              gap: isCollapsed ? '0px' : '12px',
              transition: `all ${dur} ${ease}`,
            }}
            onClick={onNavigateToDashboard}
            title={isCollapsed ? "Lessons" : undefined}
          >
            <TfiBookmarkAlt
              size={22}
              color="white"
              style={{
                flexShrink: 0,
                margin: isCollapsed ? '0 0 0 2px' : '0 0 0 0',
                transition: `margin ${dur} ${ease}`,
              }}
            />
            <span
              className="
                min-w-0 flex-1 text-left font-inter text-lg font-medium
                text-inherit
              "
              style={textStyle()}
            >
              Lessons
            </span>
          </button>
        </nav>
      </div>

      <div
        className="relative flex flex-col gap-2 overflow-visible"
        style={{
          padding: isCollapsed ? '0 10px 20px 10px' : '0 20px 20px 20px',
          transition: `padding ${dur} ${ease}`,
        }}
      >
        <button
          ref={profileButtonRef}
          onClick={toggleProfileDropdown}
          className="
            profile-button flex w-full cursor-pointer items-center overflow-clip
            rounded-lg border border-brand-border font-inter text-sm font-medium
            text-brand-gray
          "
          style={{
            backgroundColor: showProfileDropdown ? '#032242' : 'transparent',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '12px' : '8px 10px',
            gap: isCollapsed ? '0px' : '10px',
            transition: `all ${dur} ${ease}`,
          }}
          title={isCollapsed ? "Profile" : undefined}
        >
          {profilePicSrc ? (
            <img
              src={profilePicSrc}
              alt=""
              className="shrink-0 rounded-full object-cover"
              style={{
                width: 22,
                height: 22,
                margin: isCollapsed ? '0 0 0 1px' : '0 0 0 0',
                transition: `margin ${dur} ${ease}`,
              }}
            />
          ) : (
            <HiUserCircle
              size={22}
              color="#9D9D9D"
              style={{
                flexShrink: 0,
                margin: isCollapsed ? '0 0 0 1px' : '0 0 0 0',
                transition: `margin ${dur} ${ease}`,
              }}
            />
          )}
          <>
            <span
              className="
                min-w-0 flex-1 text-left font-inter text-sm font-medium
                text-brand-gray
              "
              style={textStyle()}
            >
              {displayName}
            </span>
            <MdKeyboardArrowUp
              size={20}
              color="#9D9D9D"
              style={{
                transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${animationDuration * 0.5}ms ease`,
                flexShrink: 0,
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? '0px' : '20px',
              }}
            />
          </>
        </button>

        <button
          onClick={handleLeaveFeedbackClick}
          className="
            feedback-button flex w-full cursor-pointer items-center
            overflow-clip rounded-lg border-transparent bg-transparent
            font-inter text-sm font-medium text-brand-gray
          "
          style={{
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '12px' : '12px 16px',
            gap: isCollapsed ? '0px' : '8px',
            transition: `all ${dur} ${ease}`,
          }}
          title={isCollapsed ? "Leave feedback" : undefined}
        >
          <MdOutlineThumbsUpDown
            size={19}
            color="#9D9D9D"
            style={{
              flexShrink: 0,
              margin: isCollapsed ? '0 0 0 4px' : '0 2px 0 -2px',
              transition: `margin ${dur} ${ease}`,
            }}
          />
          <span
            className="
              min-w-0 flex-1 text-left font-inter text-sm leading-none
              font-medium text-brand-gray
            "
            style={textStyle()}
          >
            Leave feedback
          </span>
        </button>
      </div>

      {showProfileDropdown && !isCollapsed && (
        <div
          ref={profileDropdownRef}
          className="
            absolute inset-x-5 bottom-33.75 z-1000 overflow-clip rounded-lg
            border border-brand-border bg-brand-search px-1 py-2
            shadow-[0_4px_12px_rgba(0,0,0,0.3)]
          "
          style={{ animation: 'fadeInUp 200ms ease-out' }}
        >
          <button
            onClick={onProfileClick}
            className="
              profile-dropdown-item mb-1 flex w-full cursor-pointer items-center
              gap-3 overflow-clip rounded-md border-none bg-transparent p-1.5
              transition-[background-color] duration-200
            "
          >
            {profilePicSrc ? (
              <img
                src={profilePicSrc}
                alt=""
                className="shrink-0 rounded-full object-cover"
                style={{ width: 21, height: 21 }}
              />
            ) : (
              <HiUserCircle size={21} color="#9D9D9D" className="shrink-0" />
            )}
            <span
              className="
                min-w-0 flex-1 text-left font-inter text-sm font-normal
                text-brand-gray
              "
              style={{ ...textStyle(), textOverflow: 'ellipsis', maxWidth: '160px' }}
            >
              {userEmail || 'email@gmail.com'}
            </span>
          </button>

          <div className="m-1.5 h-px bg-brand-border px-0.5" />

          <button
            onClick={onSettingsClick}
            className="
              profile-dropdown-item mb-1 flex w-full cursor-pointer items-center
              gap-3 overflow-clip rounded-md border-none bg-transparent p-1.5
              transition-[background-color] duration-200
            "
          >
            <MdOutlineSettings size={21} color="#9D9D9D" className="shrink-0" />
            <span
              className="
                min-w-0 flex-1 text-left font-inter text-sm font-normal
                text-brand-gray
              "
              style={textStyle()}
            >
              Settings
            </span>
          </button>

          <button
            onClick={onHelpClick}
            className="
              profile-dropdown-item mb-1 flex w-full cursor-pointer items-center
              gap-3 overflow-clip rounded-md border-none bg-transparent p-1.5
              transition-[background-color] duration-200
            "
          >
            <MdHelpOutline size={21} color="#9D9D9D" className="shrink-0" />
            <span
              className="
                min-w-0 flex-1 text-left font-inter text-sm font-normal
                text-brand-gray
              "
              style={textStyle()}
            >
              Help
            </span>
          </button>

          <button
            onClick={onSignOutClick}
            className="
              profile-dropdown-item mb-1 flex w-full cursor-pointer items-center
              gap-3 overflow-clip rounded-md border-none bg-transparent p-1.5
              transition-[background-color] duration-200
            "
          >
            <PiSignOutBold size={21} color="#9D9D9D" className="shrink-0" />
            <span
              className="
                min-w-0 flex-1 text-left font-inter text-sm font-normal
                text-brand-gray
              "
              style={textStyle()}
            >
              Sign out
            </span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
