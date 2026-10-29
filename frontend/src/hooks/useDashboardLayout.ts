import { useState, useCallback, useEffect, useRef } from 'react';

const SIDEBAR_EXPANDED_WIDTH = 250;
const SIDEBAR_COLLAPSED_WIDTH = 70;
const COLLAPSIBLE_SIDEBAR_WIDTH = 1500;
const ANIMATION_DURATION = 200;
const ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const CHAT_DEFAULT_WIDTH = 420;

export interface UseDashboardLayoutReturn {
  sidebarCollapsed: boolean;
  currentSidebarWidth: number;
  chatOpen: boolean;
  chatWidth: number;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleChatToggle: () => void;
  handleChatWidthChange: (width: number, isResizing?: boolean) => void;
  screenWidth: number;
  effectiveDuration: number;
  animationEasing: string;
  animationDuration: number;
  getMainPanelStyles: () => React.CSSProperties;
  getHeaderStyles: () => React.CSSProperties;
}

/**
 * Manages sidebar/chat panel layout, resize coordination, and animation state.
 * The sidebar is collapsed exactly when the chat is open on a narrow screen.
 */
export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [chatOpen, setChatOpen] = useState(false);
  // The chat panel's width, kept while it's closed so it reopens the same size however it's opened
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT_WIDTH);
  const [isChatResizing, setIsChatResizing] = useState(false);
  const [isWindowResizing, setIsWindowResizing] = useState(false);

  const windowResizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveDuration = (isChatResizing || isWindowResizing) ? 0 : ANIMATION_DURATION;
  const sidebarCollapsed = chatOpen && screenWidth < COLLAPSIBLE_SIDEBAR_WIDTH;
  const currentSidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  // Track screen size; transitions are disabled until resizing settles
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setIsWindowResizing(true);

      if (windowResizeTimerRef.current) {
        clearTimeout(windowResizeTimerRef.current);
      }
      windowResizeTimerRef.current = setTimeout(() => {
        setIsWindowResizing(false);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (windowResizeTimerRef.current) {
        clearTimeout(windowResizeTimerRef.current);
      }
    };
  }, []);

  const getMainPanelStyles = useCallback((): React.CSSProperties => {
    return {
      marginLeft: currentSidebarWidth,
      maxWidth: chatOpen && chatWidth > 0
        ? `calc(100vw - ${currentSidebarWidth}px - ${chatWidth}px)`
        : `calc(100vw - ${currentSidebarWidth}px)`,
      flex: 1,
      transition: effectiveDuration > 0 ? `all ${effectiveDuration}ms ${ANIMATION_EASING}` : 'none',
    };
  }, [currentSidebarWidth, chatOpen, chatWidth, effectiveDuration]);

  const getHeaderStyles = useCallback((): React.CSSProperties => {
    return {
      marginLeft: currentSidebarWidth,
      width: `calc(100vw - ${currentSidebarWidth}px)`,
      flex: 1,
      transition: effectiveDuration > 0 ? `all ${effectiveDuration}ms ${ANIMATION_EASING}` : 'none',
    };
  }, [currentSidebarWidth, effectiveDuration]);

  const handleChatWidthChange = useCallback((width: number, isResizing?: boolean) => {
    setChatWidth(width);
    setIsChatResizing(!!isResizing);
  }, []);

  const handleChatToggle = useCallback(() => {
    setChatOpen(open => !open);
  }, []);

  return {
    sidebarCollapsed,
    currentSidebarWidth,
    chatOpen,
    chatWidth,
    setChatOpen,
    handleChatToggle,
    handleChatWidthChange,
    screenWidth,
    effectiveDuration,
    animationEasing: ANIMATION_EASING,
    animationDuration: ANIMATION_DURATION,
    getMainPanelStyles,
    getHeaderStyles,
  };
}
