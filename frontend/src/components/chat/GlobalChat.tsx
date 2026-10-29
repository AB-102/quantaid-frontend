// src/components/GlobalChat.tsx

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MdClose, MdArrowUpward, MdHistory, MdDeleteOutline, MdArrowBack, MdOutlinePerson } from "react-icons/md";
import api from '@/api';
import {
  BUTTON_COLOR, CONTENT_FADE_IN_DELAY_MS, CONTENT_FADE_OUT_MS, FACE_FADE_IN_MS, FACE_FADE_OUT_MS, MORPH_CLOSE_MS,
  MORPH_EASING, MORPH_OPEN_MS, PANEL_COLOR,
} from './chatMorph';

const MAX_STORED_MESSAGES = 50;
const STORAGE_PREFIX = 'quantaid:chat:';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'explanation' | 'analogy' | 'general';
}

interface StoredSession {
  id: string;
  messages: ChatMessage[];
  lastTopic: string | null;
  timestamp: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  highlightText: string | null;
  highlightMode: 'explain' | 'analogy' | null;
  courseId: number;
  // The panel's width lives in the dashboard layout, so the lesson text makes room for it however the chat opens
  width: number;
  onWidthChange?: (width: number, isResizing?: boolean) => void;
  sidebarWidth?: number;
  // The header's Chat button: the panel grows out of it, and focus goes back to it when the panel closes
  launcherRef: React.RefObject<HTMLButtonElement>;
}

// Where the Chat button sits, relative to the panel's box
interface ButtonBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

// --- localStorage helpers ---

function getStorageKey(courseId: number): string {
  return `${STORAGE_PREFIX}${courseId}`;
}

function loadSessions(courseId: number): StoredSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey(courseId));
    if (!raw) return [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON.parse returns unknown
    const parsed: StoredSession[] = JSON.parse(raw);
    return parsed;
  } catch {
    return [];
  }
}

function saveSessions(courseId: number, sessions: StoredSession[]) {
  try {
    localStorage.setItem(getStorageKey(courseId), JSON.stringify(sessions));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

function capMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > MAX_STORED_MESSAGES
    ? messages.slice(-MAX_STORED_MESSAGES)
    : messages;
}

const GlobalChat: React.FC<Props> = ({
  isOpen,
  onClose,
  highlightText,
  highlightMode,
  courseId,
  width,
  onWidthChange,
  sidebarWidth = 250,
  launcherRef,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKey = useRef<string>('');
  const containerRef = useRef<HTMLElement>(null);
  const [buttonBox, setButtonBox] = useState<ButtonBox | null>(null);
  // The closing motion plays only after the chat has been opened, never on the first render
  const [hasOpened, setHasOpened] = useState(isOpen);
  if (isOpen && !hasOpened) setHasOpened(true);

  // Generate a unique session ID
  const newSessionId = useCallback(
    () => `${courseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    [courseId]
  );

  // Load sessions from localStorage when courseId changes
  useEffect(() => {
    const stored = loadSessions(courseId);
    setSessions(stored);

    // Start a fresh session
    const id = newSessionId();
    setActiveSessionId(id);
    setMessages([]);
    setLastTopic(null);
    setShowHistory(false);
    lastKey.current = '';
  }, [courseId, newSessionId]);

  // Persist current session to localStorage whenever messages change
  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;

    setSessions(prev => {
      const existing = prev.findIndex(s => s.id === activeSessionId);
      const updated: StoredSession = {
        id: activeSessionId,
        messages: capMessages(messages),
        lastTopic,
        timestamp: Date.now(),
      };

      let next: StoredSession[];
      if (existing >= 0) {
        next = [...prev];
        next[existing] = updated;
      } else {
        next = [...prev, updated];
      }

      // Keep at most 20 sessions per lesson
      if (next.length > 20) {
        next = next.slice(-20);
      }

      saveSessions(courseId, next);
      return next;
    });
  }, [messages, lastTopic, activeSessionId, courseId]);

  // Handle resizing with parent notification
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 300;
      const maxWidth = Math.min(600, window.innerWidth - sidebarWidth - 100);

      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      // Notify parent that we're actively resizing
      if (onWidthChange) {
        onWidthChange(constrainedWidth, true);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);

      // Notify parent that resizing has stopped
      if (onWidthChange) {
        onWidthChange(width, false);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth, width, onWidthChange]);

  // While closed, the panel is clipped down to the Chat button's rectangle. It's measured whenever that could have
  // changed, so opening always grows from where the button really is. The --chat-button-* properties feed the clip
  // shapes in index.css; without them, the panel spills in from the right edge instead.
  useLayoutEffect(() => {
    if (isOpen) return;
    const measure = () => {
      const panelElement = containerRef.current;
      const panel = panelElement?.getBoundingClientRect();
      const button = launcherRef.current?.getBoundingClientRect();
      if (!panelElement || !panel || !button) {
        for (const side of ['top', 'right', 'bottom', 'left']) panelElement?.style.removeProperty(`--chat-button-${side}`);
        setButtonBox(null);
        return;
      }
      const box: ButtonBox = {
        top: button.top - panel.top,
        right: panel.right - button.right,
        bottom: panel.bottom - button.bottom,
        left: button.left - panel.left,
        width: button.width,
        height: button.height,
      };
      panelElement.style.setProperty('--chat-button-top', `${box.top}px`);
      panelElement.style.setProperty('--chat-button-right', `${box.right}px`);
      panelElement.style.setProperty('--chat-button-bottom', `${box.bottom}px`);
      panelElement.style.setProperty('--chat-button-left', `${box.left}px`);
      setButtonBox(box);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, launcherRef, width]);

  // Closed, the panel is out of the tab order and hidden from screen readers. If focus was inside it, focus goes back
  // to the Chat button. Declared before the effect below, so the input can take focus as soon as the panel opens.
  useEffect(() => {
    const panel = containerRef.current;
    if (!panel) return;
    if (!isOpen && panel.contains(document.activeElement)) launcherRef.current?.focus();
    panel.inert = !isOpen;
  }, [isOpen, launcherRef]);

  // Auto-scroll when new messages arrive or chat opens
  useEffect(() => {
    if (!isOpen) return;

    const scrollToBottom = () => {
      if (bodyRef.current) {
        bodyRef.current.scrollTo({
          top: bodyRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => clearTimeout(timeoutId);
  }, [messages, isOpen, isLoading]);

  // Trigger on highlight changes
  useEffect(() => {
    if (!isOpen || !highlightText || !highlightMode) return;
    const key = `${highlightMode}:${highlightText}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (highlightMode === 'explain') {
      void requestExplanation(highlightText);
    } else {
      void requestAnalogy(highlightText);
    }
  }, [highlightText, highlightMode, isOpen]);

  const append = (msg: ChatMessage | ChatMessage[]) =>
    setMessages(prev => prev.concat(msg));

  const requestExplanation = async (text: string) => {
    append({ role: 'user', content: 'Explain', type: 'explanation' });

    setIsLoading(true);
    try {
      const res = await api.post(
        `/ai/explanations`,
        { text },
      );
      const explanation = res.data.explanation;
      append({ role: 'assistant', content: explanation, type: 'explanation' });
      setLastTopic(null);
    } catch (err) {
      console.error('Explanation error:', err);
      alert(`Unable to explain text: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAnalogy = async (text: string) => {
    append({ role: 'user', content: 'View Analogy', type: 'analogy' });

    setIsLoading(true);
    try {
      const res = await api.post(
        `/ai/analogies`,
        { text },
      );
      const analogy = res.data.analogy;
      append({ role: 'assistant', content: analogy, type: 'analogy' });
      setLastTopic(text);
    } catch (err) {
      console.error('Analogy error:', err);
      alert(`Unable to generate analogy: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const tryAnotherAnalogy = async () => {
    if (!lastTopic) return;

    append({ role: 'user', content: 'Try another analogy', type: 'analogy' });

    setIsLoading(true);
    try {
      const res = await api.post(
        `/ai/analogies`,
        { text: lastTopic },
      );
      const analogy = res.data.analogy;
      append({ role: 'assistant', content: analogy, type: 'analogy' });
    } catch (err) {
      console.error('Analogy error:', err);
      alert(`Unable to generate analogy: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFreeForm = async () => {
    if (!draft.trim() || isLoading) return;
    const userMsg = draft.trim();
    setDraft('');

    const newUserMessage: ChatMessage = { role: 'user', content: userMsg, type: 'general' };
    append(newUserMessage);

    setIsLoading(true);
    try {
      const res = await api.post(
        `/ai/chat`,
        { highlightedText: lastTopic ?? '', messages: messages.concat(newUserMessage) },
      );
      const reply = res.data.assistantReply;
      append({ role: 'assistant', content: reply, type: 'general' });
      setLastTopic(null);
    } catch (err) {
      console.error('Chat error:', err);
      alert(`Chat error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- History actions ---

  const handleChatHistoryClick = () => {
    setSessions(loadSessions(courseId));
    setShowHistory(true);
  };

  const handleRestoreSession = (session: StoredSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setLastTopic(session.lastTopic);
    setShowHistory(false);
    lastKey.current = '';
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessions(courseId, updated);

    // If we deleted the active session, start a new one
    if (sessionId === activeSessionId) {
      const id = newSessionId();
      setActiveSessionId(id);
      setMessages([]);
      setLastTopic(null);
    }
  };

  const handleNewChat = () => {
    const id = newSessionId();
    setActiveSessionId(id);
    setMessages([]);
    setLastTopic(null);
    setShowHistory(false);
    lastKey.current = '';
  };

  const handleClearAllHistory = () => {
    saveSessions(courseId, []);
    setSessions([]);
    handleNewChat();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // The panel grows out of the Chat button and shrinks back into it (see chatMorph.ts). Its clip shapes are the
  // chat-spill-open/-close keyframes in index.css.
  const getContainerStyles = (): React.CSSProperties => isOpen
    ? {
      width,
      backgroundColor: PANEL_COLOR,
      visibility: 'visible',
      animation: `chat-spill-open ${MORPH_OPEN_MS}ms both`,
      transition: `background-color ${MORPH_OPEN_MS}ms ${MORPH_EASING}`,
    }
    : {
      width,
      backgroundColor: BUTTON_COLOR,
      visibility: 'hidden',
      animation: hasOpened ? `chat-spill-close ${MORPH_CLOSE_MS}ms both` : 'none',
      transition: `background-color ${MORPH_CLOSE_MS}ms ${MORPH_EASING}, visibility 0s linear ${MORPH_CLOSE_MS}ms`,
    };

  const faceStyle: React.CSSProperties = isOpen
    ? { opacity: 0, transition: `opacity ${FACE_FADE_OUT_MS}ms ease-out` }
    : { opacity: 1, transition: `opacity ${FACE_FADE_IN_MS}ms ease-in ${MORPH_CLOSE_MS - FACE_FADE_IN_MS}ms` };

  const contentStyle: React.CSSProperties = isOpen
    ? { opacity: 1, transition: `opacity ${MORPH_OPEN_MS - CONTENT_FADE_IN_DELAY_MS}ms ease-out ${CONTENT_FADE_IN_DELAY_MS}ms` }
    : { opacity: 0, transition: `opacity ${CONTENT_FADE_OUT_MS}ms ease-in` };

  const formatSessionDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (isYesterday) return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ` ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getSessionPreview = (session: StoredSession): string => {
    const firstUser = session.messages.find(m => m.role === 'user');
    if (!firstUser) return 'Empty conversation';
    const text = firstUser.content;
    return text.length > 60 ? text.slice(0, 57) + '...' : text;
  };

  // Filter out the active session from history (it's the current chat)
  const pastSessions = sessions
    .filter(s => s.id !== activeSessionId && s.messages.length > 0)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <aside
      ref={containerRef}
      id="ai-chat-panel"
      aria-label="Chat"
      data-open={isOpen}
      style={getContainerStyles()}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      className="
        global-chat-coordinated fixed inset-y-0 right-0 z-2000 flex h-full
        max-w-150 min-w-75 shrink-0 flex-col text-white
        shadow-[0_0_10px_rgba(0,0,0,0.4)]
      "
    >
      {/* A copy of the Chat button where the real one sits, so the panel takes its place seamlessly */}
      {buttonBox && (
        <div
          aria-hidden="true"
          style={{ ...faceStyle, top: buttonBox.top, left: buttonBox.left, width: buttonBox.width, height: buttonBox.height }}
          className="
            pointer-events-none absolute flex items-center justify-center
            gap-1.5 rounded-lg bg-brand-search font-inter text-base font-medium
            text-brand-gray
          "
        >
          <MdOutlinePerson size="1.5em" /> <span>Chat</span>
        </div>
      )}

      {/* The chat itself fades in once the panel has grown a little, and out before it shrinks */}
      <div style={contentStyle} className="flex min-h-0 flex-1 flex-col">
        {isOpen && (
          <div
            onMouseDown={handleResizeStart}
            className="
              resizer absolute inset-y-0 left-0 z-1 w-1 cursor-ew-resize
              bg-transparent transition-[background-color] duration-150
            "
          />
        )}

        <div className="
          flex shrink-0 items-center justify-end bg-brand-dark-panel px-5 py-3
        ">
          {showHistory ? (
            <>
              <button
                onClick={() => setShowHistory(false)}
                aria-label="Back to chat"
                className="
                  global-chat-icon-btn cursor-pointer border-none bg-transparent
                  px-1 py-0 leading-none text-white transition-[color]
                  duration-200
                "
              >
                <MdArrowBack size={24} />
              </button>
              <span className="
                flex-1 text-center font-inter text-base font-medium text-white
              ">Chat History</span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="
                  global-chat-icon-btn cursor-pointer border-none bg-transparent
                  px-1 py-0 leading-none text-white transition-[color]
                  duration-200
                "
              >
                <MdClose size={24} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleChatHistoryClick}
                aria-label="Chat History"
                className="
                  global-chat-icon-btn cursor-pointer border-none bg-transparent
                  px-1 py-0 leading-none text-white transition-[color]
                  duration-200
                "
              >
                <MdHistory size={24} />
              </button>
              <button
                onClick={onClose}
                aria-label="Close"
                className="
                  global-chat-icon-btn cursor-pointer border-none bg-transparent
                  px-1 py-0 leading-none text-white transition-[color]
                  duration-200
                "
              >
                <MdClose size={24} />
              </button>
            </>
          )}
        </div>

        {showHistory ? (
          <div className="
            flex flex-1 flex-col gap-2 overflow-y-auto px-5 pt-0 pb-5
          ">
            <button
              onClick={handleNewChat}
              className="
                mb-2 w-full cursor-pointer rounded-lg border-none bg-[#7B99C9]
                px-4 py-3 font-inter text-sm font-medium text-black
                transition-opacity duration-200
                hover:opacity-90
              "
            >
              + New Chat
            </button>

            {pastSessions.length === 0 ? (
              <div className="
                shrink-0 p-7.5 text-center text-[#f8f9fa] opacity-70
              ">
                No previous conversations for this lesson.
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
                {pastSessions.map(session => (
                  <div
                    key={session.id}
                    className="
                      flex cursor-pointer items-center gap-2 rounded-lg
                      bg-brand-section px-3.5 py-3 transition-[background]
                      duration-150
                      hover:bg-[#353A56]
                    "
                    onClick={() => handleRestoreSession(session)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="
                        truncate font-inter text-sm font-normal text-white
                      ">{getSessionPreview(session)}</div>
                      <div className="mt-1 font-inter text-xs text-[#8899AA]">
                        {formatSessionDate(session.timestamp)} · {session.messages.length} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      aria-label="Delete conversation"
                      className="
                        global-chat-icon-btn flex shrink-0 cursor-pointer
                        items-center justify-center rounded-sm border-none
                        bg-transparent p-1 text-[#8899AA] transition-[color]
                        duration-150
                      "
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pastSessions.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="
                  mt-3 w-full cursor-pointer rounded-lg border border-error-alt
                  bg-transparent px-4 py-2.5 font-inter text-[13px] font-normal
                  text-error-alt transition-[background,color] duration-150
                  hover:bg-error-alt/10
                "
              >
                Clear all history
              </button>
            )}
          </div>
        ) : (
          <>
            <div ref={bodyRef} className="
              flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden
              overflow-y-auto px-5 py-3.75
            ">
              <div className="
                flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden
                overflow-y-auto px-5 py-3.75
              ">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user'
                    ? `
                      max-w-[80%] shrink-0 self-end rounded-[12px_12px_2px_12px]
                      bg-[#2F3D68] px-3.75 py-2.5 font-inter font-normal
                      wrap-break-word whitespace-pre-wrap text-white
                    `
                    : `
                      max-w-full shrink-0 self-start border-none
                      bg-brand-dark-panel px-3.75 py-2.5 font-inter font-normal
                      wrap-break-word whitespace-pre-wrap text-white
                    `
                  }>
                    {m.content}
                  </div>
                ))}

                {isLoading && (
                  <div className="
                    flex shrink-0 items-center gap-2.5 font-inter font-normal
                    text-[#f8f9fa] italic
                  ">
                    <div className="
                      size-4.5 shrink-0 animate-spin rounded-full border-[3px]
                      border-brand-border border-t-warn
                    " />
                    Thinking...
                  </div>
                )}

                {messages.length === 0 && !isLoading && (
                  <div className="
                    shrink-0 p-7.5 text-center text-[#f8f9fa] opacity-70
                  ">
                    Highlight lesson text or ask a question to get started.
                  </div>
                )}
              </div>

              {!isLoading && lastTopic && messages.slice(-1)[0]?.type === 'analogy' && (
                <div className="
                  pointer-events-none absolute inset-x-0 bottom-15 flex
                  justify-start px-5 py-3.75
                ">
                  <button
                    onClick={() => { void tryAnotherAnalogy(); }}
                    className="
                      pointer-events-auto flex cursor-pointer items-center
                      rounded-lg border border-white bg-brand-dark-panel px-4.5
                      py-2 font-inter text-sm font-normal text-white
                      transition-all duration-200
                      hover:bg-white/10
                    "
                  >
                    Try another analogy
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6.25 shrink-0 bg-brand-dark-panel px-5 py-3.75">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  className="
                    global-chat-input box-border min-h-12 w-full rounded-lg
                    border-none bg-brand-section py-3.5 pr-12.5 pl-3.75
                    font-inter text-base font-normal text-white
                    transition-[border-color] duration-200 outline-none
                  "
                  placeholder="Ask me anything"
                  value={draft}
                  disabled={isLoading}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { void sendFreeForm(); } }}
                />
                <button
                  onClick={() => { void sendFreeForm(); }}
                  disabled={isLoading || !draft.trim()}
                  aria-label="Send"
                  className="
                    global-chat-send-btn absolute right-2 flex size-9 shrink-0
                    cursor-pointer items-center justify-center rounded-md
                    border-none bg-[#7B99C9] text-base text-black
                    transition-[background-color] duration-200
                  "
                >
                  <MdArrowUpward size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default GlobalChat;
