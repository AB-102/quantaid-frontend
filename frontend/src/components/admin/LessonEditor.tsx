// src/components/LessonEditor.tsx
// Block-based lesson editor for the admin Content Management tab.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import api, { BACKEND_URL } from '@/api';

function getAxiosErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(err) && err.response?.data.error) {
    return err.response.data.error;
  }
  return fallback;
}

import type { ContentBlock } from '@/types/lesson';
import type { Question as QuizQuestion } from '@/types/quiz';

interface LessonSummary {
  _id: string;
  courseId: number;
  title: string;
}

interface LessonFull {
  _id: string;
  courseId: number;
  title: string;
  blocks: ContentBlock[];
  quiz: QuizQuestion[];
  interactiveTerms: Record<string, string>;
}

const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'subheading', label: 'Subheading' },
  { value: 'image', label: 'Image' },
] as const;

type EditorSection = 'blocks' | 'quiz';

interface LessonEditorProps {
  initialCourseId?: number;
  onBack?: () => void;
}

// Shared class strings
const inputCls       = 'py-2 px-2.5 bg-brand-bg border border-brand-card rounded text-[#E5E7EB] text-[13px] font-inter box-border w-full mb-2.5';
const inputInlineCls = 'py-2 px-2.5 bg-brand-bg border border-brand-card rounded text-[#E5E7EB] text-[13px] font-inter box-border';
const blockTextareaCls = 'w-full py-2 px-2.5 bg-brand-bg border border-brand-card rounded text-[#E5E7EB] font-inter box-border resize-y';
const iconBtnCls     = 'bg-transparent border-none text-[#9DA7B7] cursor-pointer text-xs py-0.5 px-1.5 rounded-sm font-inter';
const actionBtnCls   = 'py-2 px-3.5 bg-brand-card text-[#9DA7B7] border border-brand-border-dark rounded-md cursor-pointer text-[13px] font-medium font-inter whitespace-nowrap';
const saveBtnCls     = 'py-2.5 px-6 bg-[#1a3b2a] text-success border border-[#166534] rounded-md cursor-pointer text-sm font-semibold font-inter';
const cancelBtnCls   = 'py-2 px-3.5 bg-brand-card text-[#9DA7B7] border border-brand-border-dark rounded-md cursor-pointer text-[13px] font-inter';
const addBtnCls      = 'py-1.5 px-3.5 bg-brand-card text-[#9DA7B7] border border-brand-border-dark rounded-md cursor-pointer text-[13px] font-inter';
const uploadBtnCls   = 'py-1.5 px-3.5 bg-[#1e3a5f] text-[#60a5fa] border border-[#2563eb] rounded-md cursor-pointer text-[13px] font-inter';
const sectionTabBase = 'py-2 px-4.5 bg-transparent border-none border-b-2 text-sm font-medium cursor-pointer font-inter';

const LessonEditor: React.FC<LessonEditorProps> = ({ initialCourseId, onBack }) => {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [title, setTitle] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [activeSection, setActiveSection] = useState<EditorSection>('blocks');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [showNewLessonForm, setShowNewLessonForm] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [showReorder, setShowReorder] = useState(false);
  const [reorderList, setReorderList] = useState<LessonSummary[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIdx = useRef<number>(-1);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await api.get('/api/lessons');
      setLessons(res.data);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  }, []);

  useEffect(() => { void fetchLessons(); }, [fetchLessons]);

  useEffect(() => {
    if (initialCourseId !== undefined && selectedCourseId === null) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCourseId === null) {
      setLesson(null); setBlocks([]); setTitle(''); setQuiz([]);
      return;
    }
    let cancelled = false;
    api.get(`/api/lessons/${selectedCourseId}`)
      .then(res => {
        if (cancelled) return;
        setLesson(res.data);
        setBlocks(res.data.blocks || []);
        setTitle(res.data.title || '');
        setQuiz(res.data.quiz || []);
      })
      .catch((err: unknown) => {
        console.error('Error fetching lesson:', err);
        setMessage('Failed to load lesson');
      });
    return () => { cancelled = true; };
  }, [selectedCourseId]);

  const updateBlock = (idx: number, updates: Partial<ContentBlock>) =>
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, ...updates } : b));
  const removeBlock = (idx: number) =>
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  const moveBlock = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    setBlocks(prev => { const next = [...prev]; [next[idx], next[newIdx]] = [next[newIdx], next[idx]]; return next; });
  };
  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = type === 'image'
      ? { type: 'image', fileId: '', caption: '', alt: '', align: 'center', width: 80 }
      : { type, text: '' };
    setBlocks(prev => [...prev, newBlock]);
  };

  const addQuizQuestion = () => setQuiz(prev => [...prev, { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }]);
  const updateQuizQuestion = (idx: number, updates: Partial<QuizQuestion>) =>
    setQuiz(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q));
  const updateQuizOption = (qIdx: number, optIdx: number, value: string) =>
    setQuiz(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options]; options[optIdx] = value; return { ...q, options };
    }));
  const removeQuizQuestion = (idx: number) => setQuiz(prev => prev.filter((_, i) => i !== idx));
  const moveQuizQuestion = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= quiz.length) return;
    setQuiz(prev => { const next = [...prev]; [next[idx], next[newIdx]] = [next[newIdx], next[idx]]; return next; });
  };

  const handleImageUpload = (idx: number) => { uploadTargetIdx.current = idx; fileInputRef.current?.click(); };
  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const idx = uploadTargetIdx.current;
    setUploading(idx);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/admin/upload_content_image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateBlock(idx, { fileId: res.data.fileId });
      setMessage('Image uploaded');
    } catch (err) {
      console.error('Image upload error:', err);
      setMessage('Image upload failed');
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (selectedCourseId === null) return;
    setSaving(true); setMessage('');
    try {
      await api.put(`/admin/lessons/${selectedCourseId}`, { title, blocks, quiz });
      setMessage('Lesson saved successfully');
      void fetchLessons();
    } catch (err: unknown) {
      setMessage(`Error: ${getAxiosErrorMessage(err, 'Failed to save')}`);
    } finally { setSaving(false); }
  };

  const handleCreateLesson = async () => {
    if (!newLessonTitle.trim()) return;
    setMessage('');
    try {
      const maxId = lessons.length > 0 ? Math.max(...lessons.map(l => l.courseId)) : -1;
      await api.post('/admin/lessons', { courseId: maxId + 1, title: newLessonTitle.trim(), blocks: [], quiz: [] });
      setMessage('Lesson created');
      setNewLessonTitle(''); setShowNewLessonForm(false);
      await fetchLessons();
      setSelectedCourseId(maxId + 1);
    } catch (err: unknown) {
      setMessage(`Error: ${getAxiosErrorMessage(err, 'Failed to create')}`);
    }
  };

  const handleDeleteLesson = async () => {
    if (selectedCourseId === null) return;
    if (!window.confirm(`Delete lesson "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/lessons/${selectedCourseId}`);
      setMessage('Lesson deleted'); setSelectedCourseId(null); void fetchLessons();
    } catch (err: unknown) {
      setMessage(`Error: ${getAxiosErrorMessage(err, 'Failed to delete')}`);
    }
  };

  const startReorder = () => { setReorderList([...lessons]); setShowReorder(true); };
  const moveLesson = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= reorderList.length) return;
    setReorderList(prev => { const next = [...prev]; [next[idx], next[newIdx]] = [next[newIdx], next[idx]]; return next; });
  };
  const saveReorder = async () => {
    try {
      await api.post('/admin/lessons/reorder', { order: reorderList.map(l => l.courseId) });
      setMessage('Lessons reordered'); setShowReorder(false); setSelectedCourseId(null); void fetchLessons();
    } catch (err: unknown) {
      setMessage(`Error: ${getAxiosErrorMessage(err, 'Failed to reorder')}`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/lessons/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = 'lessons_export.json'; link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Export error:', err); setMessage('Export failed');
    }
  };

  const renderPreview = () => (
    <div className="
      sticky top-5 max-h-[calc(100vh-120px)] overflow-y-auto rounded-lg border
      border-brand-card bg-[#0f1729] p-5
    ">
      <h3 className="
        mb-4 border-b border-brand-card pb-2 text-base font-semibold
        text-[#9DA7B7]
      ">Preview</h3>
      <div className="font-inter text-[15px] leading-normal text-white">
        {blocks.map((block, idx) => {
          if (block.type === 'image') {
            if (!block.fileId) return (
              <div key={idx} className="
                my-4 rounded-lg border-2 border-dashed border-brand-border-dark
                bg-brand-panel px-0 py-6 text-center text-[#6B7280] italic
              ">
                No image uploaded
              </div>
            );
            return (
              <figure key={idx} role="figure" aria-label={block.alt || block.caption || 'Lesson image'}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: block.align === 'left' ? 'flex-start' : block.align === 'right' ? 'flex-end' : 'center',
                  margin: '24px 0', userSelect: 'none',
                }}>
                <img src={`${BACKEND_URL}/file/${block.fileId}`} alt="" aria-hidden="true"
                  style={{ maxWidth: `${block.width || 80}%`, borderRadius: 8, objectFit: 'contain' }}
                  draggable={false}
                />
                {block.caption && <figcaption className="
                  mt-2 text-[0.9rem] text-[#aab4c8] italic
                ">{block.caption}</figcaption>}
              </figure>
            );
          }
          const text = block.text || '';
          if (block.type === 'heading')    return <h3 key={idx} className="
            mt-6 mb-3 text-[1.3rem] font-semibold tracking-[0.75px] text-white
          ">{text}</h3>;
          if (block.type === 'subheading') return <h4 key={idx} className="
            mt-4.5 mb-2 text-[1.1rem] font-medium tracking-[0.75px] text-white
          ">{text}</h4>;
          return <p key={idx} className="mb-4.5 text-white">{text}</p>;
        })}
        {blocks.length === 0 && <p className="text-[#6B7280] italic">No content blocks yet.</p>}
      </div>
    </div>
  );

  // --- Reorder modal ---
  if (showReorder) {
    return (
      <div>
        <h3 className="mb-4 text-[#F9FAFB]">Reorder Lessons</h3>
        <p className="mb-3 text-[13px] text-[#9DA7B7]">
          Drag order determines courseId and display order in the dashboard.
        </p>
        {reorderList.map((l, idx) => (
          <div key={l._id} className="
            mb-1 flex items-center gap-3 rounded-md border border-brand-card
            bg-brand-panel px-3.5 py-2.5
          ">
            <span className="w-6 text-center text-xs text-[#6B7280]">{idx}</span>
            <span className="flex-1 text-[#E5E7EB]">{l.title}</span>
            <button onClick={() => moveLesson(idx, -1)} disabled={idx === 0} className={iconBtnCls} title="Move up">&#9650;</button>
            <button onClick={() => moveLesson(idx, 1)} disabled={idx === reorderList.length - 1} className={iconBtnCls} title="Move down">&#9660;</button>
          </div>
        ))}
        <div className="mt-4 flex gap-2">
          <button onClick={() => { void saveReorder(); }} className={saveBtnCls}>Save Order</button>
          <button onClick={() => setShowReorder(false)} className={cancelBtnCls}>Cancel</button>
        </div>
        {message && <span className={`
          ml-3 text-sm
          ${message.startsWith('Error') ? `text-error` : `text-success`}
        `}>{message}</span>}
      </div>
    );
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onFileSelected(e); }} />

      {/* Top action bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {onBack && (
          <button onClick={onBack} className={actionBtnCls} title="Back to dashboard manager">&larr; Back</button>
        )}
        <select
          value={selectedCourseId ?? ''}
          onChange={e => setSelectedCourseId(e.target.value === '' ? null : Number(e.target.value))}
          className="
            flex-1 rounded-md border border-brand-border-dark bg-brand-bg px-3
            py-2.5 font-inter text-sm text-[#E5E7EB]
          "
        >
          <option value="">Select a lesson to edit...</option>
          {lessons.map(l => (
            <option key={l.courseId} value={l.courseId}>Lesson {l.courseId}: {l.title}</option>
          ))}
        </select>
        <button onClick={() => setShowNewLessonForm(v => !v)} className={actionBtnCls} title="New lesson">+ New</button>
        <button onClick={startReorder} className={actionBtnCls} title="Reorder lessons" disabled={lessons.length < 2}>Reorder</button>
        <button onClick={() => { void handleExport(); }} className={actionBtnCls} title="Export all lessons as JSON">Export</button>
        {selectedCourseId !== null && (
          <label className="
            flex cursor-pointer items-center text-sm whitespace-nowrap
            text-[#9DA7B7]
          ">
            <input type="checkbox" checked={showPreview} onChange={e => setShowPreview(e.target.checked)} />
            <span className="ml-1.5">Preview</span>
          </label>
        )}
      </div>

      {/* New lesson form */}
      {showNewLessonForm && (
        <div className="
          mb-3 flex items-center gap-2 rounded-md border border-brand-card
          bg-brand-panel px-3.5 py-3
        ">
          <input
            value={newLessonTitle}
            onChange={e => setNewLessonTitle(e.target.value)}
            placeholder="New lesson title..."
            className={`
              ${inputInlineCls}
              flex-1
            `}
            onKeyDown={e => { if (e.key === 'Enter') void handleCreateLesson(); }}
          />
          <button onClick={() => { void handleCreateLesson(); }} className={saveBtnCls} disabled={!newLessonTitle.trim()}>Create</button>
          <button onClick={() => setShowNewLessonForm(false)} className={cancelBtnCls}>Cancel</button>
        </div>
      )}

      {/* Message bar */}
      {message && (
        <div className={`
          mb-3 rounded-md px-3.5 py-2 text-[13px]
          ${message.startsWith('Error') ? `bg-[#3b1a1a] text-error` : `
            bg-[#1a3b2a] text-success
          `}
        `}>
          {message}
        </div>
      )}

      {selectedCourseId !== null && lesson && (
        <>
          {/* Title + delete */}
          <div className="mb-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[13px] text-[#9DA7B7]">Lesson Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="
                  box-border w-full rounded-md border border-brand-border-dark
                  bg-brand-bg px-3 py-2.5 font-inter text-base font-semibold
                  text-[#E5E7EB]
                "
              />
            </div>
            <button onClick={() => { void handleDeleteLesson(); }} className="
              cursor-pointer rounded-md border-none bg-[#5f1e1e] px-3.5 py-2
              font-inter text-[13px] font-semibold whitespace-nowrap text-error
            " title="Delete this lesson">
              Delete Lesson
            </button>
          </div>

          {/* Section tabs */}
          <div className="mb-4 flex gap-0 border-b border-brand-border-dark">
            <button
              className={`
                ${sectionTabBase}
                ${activeSection === 'blocks' ? `
                  border-b-[#60a5fa] text-[#F9FAFB]
                ` : `border-b-transparent text-[#9DA7B7]`}
              `}
              onClick={() => setActiveSection('blocks')}
            >
              Content ({blocks.length} blocks)
            </button>
            <button
              className={`
                ${sectionTabBase}
                ${activeSection === 'quiz' ? `border-b-[#60a5fa] text-[#F9FAFB]` : `
                  border-b-transparent text-[#9DA7B7]
                `}
              `}
              onClick={() => setActiveSection('quiz')}
            >
              Quiz ({quiz.length} questions)
            </button>
          </div>

          <div className="flex gap-5">
            <div className="flex-1">
              {/* === BLOCKS EDITOR === */}
              {activeSection === 'blocks' && (
                <>
                  {blocks.map((block, idx) => (
                    <div key={idx} className="
                      mb-2 rounded-md border border-brand-card bg-brand-panel
                      px-3.5 py-2.5
                    ">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="
                          text-[11px] font-bold tracking-[1px] text-[#60a5fa]
                        ">{block.type.toUpperCase()}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className={iconBtnCls} title="Move up">&#9650;</button>
                          <button onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} className={iconBtnCls} title="Move down">&#9660;</button>
                          <button onClick={() => removeBlock(idx)} className={`
                            ${iconBtnCls}
                            text-error
                          `} title="Delete">&#10005;</button>
                        </div>
                      </div>

                      {block.type === 'image' ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="mb-2 flex items-center gap-2">
                            <button onClick={() => handleImageUpload(idx)} className={uploadBtnCls} disabled={uploading === idx}>
                              {uploading === idx ? 'Uploading...' : block.fileId ? 'Replace Image' : 'Upload Image'}
                            </button>
                            {block.fileId && <img src={`${BACKEND_URL}/file/${block.fileId}`} alt="preview" className="
                              h-10 rounded-sm object-contain
                            " />}
                          </div>
                          <input placeholder="Caption (shown below image)" value={block.caption || ''} onChange={e => updateBlock(idx, { caption: e.target.value })} className={inputCls} />
                          <input placeholder="Alt text (for accessibility)" value={block.alt || ''} onChange={e => updateBlock(idx, { alt: e.target.value })} className={inputCls} />
                          <div className="flex gap-2">
                            <select value={block.align || 'center'} onChange={e => { const v = e.target.value; if (v === 'center' || v === 'left' || v === 'right') updateBlock(idx, { align: v }); }} className={`
                              ${inputInlineCls}
                              flex-1
                            `}>
                              <option value="center">Center</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                            </select>
                            <input type="number" min={20} max={100} value={block.width ?? 80} onChange={e => updateBlock(idx, { width: Number(e.target.value) })} className={`
                              ${inputInlineCls}
                              flex-1
                            `} placeholder="Width %" />
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={block.text || ''}
                          onChange={e => updateBlock(idx, { text: e.target.value })}
                          className={blockTextareaCls}
                          style={{
                            fontWeight: block.type === 'heading' ? 600 : block.type === 'subheading' ? 500 : 400,
                            fontSize: block.type === 'heading' ? 16 : block.type === 'subheading' ? 15 : 14,
                          }}
                          rows={block.type === 'paragraph' ? 3 : 1}
                        />
                      )}
                    </div>
                  ))}

                  <div className="mt-3 mb-4 flex flex-wrap gap-2">
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.value} onClick={() => addBlock(bt.value)} className={addBtnCls}>+ {bt.label}</button>
                    ))}
                  </div>
                </>
              )}

              {/* === QUIZ EDITOR === */}
              {activeSection === 'quiz' && (
                <>
                  {quiz.map((q, qIdx) => (
                    <div key={qIdx} className="
                      mb-2 rounded-md border border-brand-card bg-brand-panel
                      px-3.5 py-2.5
                    ">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="
                          text-[11px] font-bold tracking-[1px] text-[#60a5fa]
                        ">QUESTION {qIdx + 1}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveQuizQuestion(qIdx, -1)} disabled={qIdx === 0} className={iconBtnCls} title="Move up">&#9650;</button>
                          <button onClick={() => moveQuizQuestion(qIdx, 1)} disabled={qIdx === quiz.length - 1} className={iconBtnCls} title="Move down">&#9660;</button>
                          <button onClick={() => removeQuizQuestion(qIdx)} className={`
                            ${iconBtnCls}
                            text-error
                          `} title="Delete">&#10005;</button>
                        </div>
                      </div>

                      <textarea
                        value={q.question}
                        onChange={e => updateQuizQuestion(qIdx, { question: e.target.value })}
                        placeholder="Question text..."
                        className={`
                          ${blockTextareaCls}
                          mb-2
                        `}
                        rows={2}
                      />

                      <div className="mb-2 flex flex-col gap-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctAnswer === optIdx}
                              onChange={() => updateQuizQuestion(qIdx, { correctAnswer: optIdx })}
                              title="Mark as correct answer"
                            />
                            <input
                              value={opt}
                              onChange={e => updateQuizOption(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className={`
                                ${inputInlineCls}
                                flex-1
                              `}
                            />
                          </div>
                        ))}
                      </div>

                      <input
                        value={q.explanation || ''}
                        onChange={e => updateQuizQuestion(qIdx, { explanation: e.target.value })}
                        placeholder="Explanation (shown after answering)"
                        className={inputCls}
                      />
                    </div>
                  ))}

                  <button onClick={addQuizQuestion} className={addBtnCls}>+ Add Question</button>
                </>
              )}

              {/* Save bar */}
              <div className="mt-4 flex items-center">
                <button onClick={() => { void handleSave(); }} disabled={saving} className={saveBtnCls}>
                  {saving ? 'Saving...' : 'Save Lesson'}
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && activeSection === 'blocks' && (
              <div className="max-w-[50%] flex-1">{renderPreview()}</div>
            )}
          </div>
        </>
      )}

      {selectedCourseId === null && !showNewLessonForm && (
        <p className="mt-4 text-[#6B7280]">Select a lesson above to edit, or create a new one.</p>
      )}
    </div>
  );
};

export default LessonEditor;
