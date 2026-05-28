import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { MdOutlinePerson } from 'react-icons/md';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  view: 'dashboard' | 'course-detail' | 'lesson';
  quizOpen: boolean;
  onChatToggle: () => void;
  headerStyle: React.CSSProperties;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  view,
  quizOpen,
  onChatToggle,
  headerStyle,
}) => {
  return (
    <header
      style={headerStyle}
      className="
        main-panel-coordinated fixed inset-x-0 top-0 z-99 flex items-center
        justify-between border-b border-brand-border bg-brand-bg px-16
        py-[0.9rem] text-white
      "
      role="banner"
    >
      <form onSubmit={onSearchSubmit} className="flex items-center" role="search">
        <div className="
          search-container relative flex min-w-75 items-center rounded-lg
          border-transparent bg-brand-search px-3 py-2 font-inter text-[1.3rem]
          font-medium text-brand-gray-mid
          transition-[border-color,background-color] duration-200
        ">
          <FaSearch className="mr-2 text-sm text-brand-gray-mid" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search Quantaid"
            value={searchQuery}
            onChange={onSearchChange}
            className="
              search-input flex-1 border-none bg-transparent text-sm text-white
              outline-none
            "
            aria-label="Search Quantaid"
          />
        </div>
      </form>

      <div className="flex items-center gap-3.75">
        {view === 'lesson' && !quizOpen && (
          <button
            className="
              chat-button fixed top-[0.9rem] right-16 z-1900 flex h-auto
              cursor-pointer items-center justify-center gap-1.5 rounded-lg
              border-transparent bg-brand-search px-3.5 py-1.5 font-inter
              text-base font-medium text-brand-gray transition-all duration-200
            "
            onClick={onChatToggle}
            aria-label="Toggle Chat"
          >
            <MdOutlinePerson size="1.5em" /> <span>Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
