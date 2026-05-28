// src/components/GlobalChat.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MdClose, MdArrowUpward, MdHistory, MdDeleteOutline, MdArrowBack } from "react-icons/md";
import api from '@/api';

const MAX_STORED_MESSAGES = 50;
const STORAGE_PREFIX = 'quantaid:chat:';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
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
  onWidthChange?: (width: number, isResizing?: boolean) => void;
  sidebarWidth?: number;
  animationDuration?: number;
  animationEasing?: string;
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
  onWidthChange,
  sidebarWidth = 250,
  animationDuration = 300,
  animationEasing = 'cubic-bezier(0.4, 0, 0.2, 1)',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [width, setWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKey = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

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
      setWidth(constrainedWidth);

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
        `/explain_text`,
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
        `/generate_analogy`,
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
        `/generate_analogy`,
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
        `/chat_about_text`,
        { highlighted_text: lastTopic ?? '', messages: messages.concat(newUserMessage) },
      );
      const reply = res.data.assistant_reply;
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

  const getContainerStyles = (): React.CSSProperties => ({
    width: width,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: `transform ${animationDuration}ms ${animationEasing}`,
  });

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
    <div
      ref={containerRef}
      style={getContainerStyles()}
      className="
        global-chat-coordinated fixed inset-y-0 right-0 z-2000 flex h-full
        max-w-150 min-w-75 shrink-0 flex-col bg-brand-dark-panel text-white
        shadow-[0_0_10px_rgba(0,0,0,0.4)]
      "
    >
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
              "
            >
              Clear all history
            </button>
          )}
        </div>
      ) : (
        <>
          <div ref={bodyRef} className="
            flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto
            px-5 py-3.75
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
                  border-none bg-brand-section py-3.5 pr-12.5 pl-3.75 font-inter
                  text-base font-normal text-white transition-[border-color]
                  duration-200 outline-none
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
  );
};

export default GlobalChat;
