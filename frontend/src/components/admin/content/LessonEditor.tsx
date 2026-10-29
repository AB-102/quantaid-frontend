// src/components/admin/content/LessonEditor.tsx
// The lesson as one source document (Markdown + TeX math, see lessonSource.ts) beside a preview of what students
// will see. The workspace holds the title and source, and saves them.

import { markdown } from '@codemirror/lang-markdown';
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import React, { useMemo, useRef, useState } from 'react';
import api from '@/api';
import { aiPrompt } from './aiPrompt';
import LessonPreview from './LessonPreview';
import { addBlockLabel, newLabel, setQuestionReview, sourceToLesson } from './lessonSource';
import LinkContentDialog from './LinkContentDialog';
import PasteFromAiDialog from './PasteFromAiDialog';
import RevisionHistory from './RevisionHistory';
import RowMenu from './RowMenu';
import { hintCls, inputCls, labelCls, secondaryBtnCls, toolBtnCls } from './styles';

// Created once: a new array each render would reconfigure the editor
const EXTENSIONS = [markdown(), EditorView.lineWrapping];

const QUESTION_TEMPLATE = '### Question text?\n- [ ] A wrong answer\n- [x] The correct answer\n> Why the correct answer is right';

interface LessonEditorProps {
  lessonId: number;
  exists: boolean;
  title: string;
  source: string;
  // Changes after each save, so History picks up the version it replaced
  version: number;
  onChange: (changes: { title?: string; source?: string }) => void;
  notify: (kind: 'success' | 'error', text: string) => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ lessonId, exists, title, source, version, onChange, notify }) => {
  const [tab, setTab] = useState<'write' | 'history'>('write');
  const [linkingQuestion, setLinkingQuestion] = useState<number | null>(null);
  const [pasting, setPasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const markdownInputRef = useRef<HTMLInputElement>(null);

  const lesson = useMemo(() => sourceToLesson(source), [source]);

  // --- Toolbar edits, made in the editor so they can be undone with Ctrl+Z ---

  const withEditor = (edit: (view: EditorView) => void) => {
    const view = editorRef.current?.view;
    if (!view) return;
    edit(view);
    view.focus();
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => withEditor(view => {
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to) || placeholder;
    view.dispatch({
      changes: { from, to, insert: `${before}${selected}${after}` },
      selection: { anchor: from + before.length, head: from + before.length + selected.length },
    });
  });

  const setLinePrefix = (prefix: string) => withEditor(view => {
    const line = view.state.doc.lineAt(view.state.selection.main.head);
    const existing = line.text.match(/^#{1,6}[ \t]+/)?.[0] ?? '';
    view.dispatch({ changes: { from: line.from, to: line.from + existing.length, insert: prefix } });
  });

  // Puts a block on its own after the current line, with blank lines around it
  const insertBlock = (text: string) => withEditor(view => {
    const line = view.state.doc.lineAt(view.state.selection.main.head);
    const insert = line.text.trim() === '' ? `${text}\n` : `\n\n${text}\n`;
    view.dispatch({ changes: { from: line.to, insert }, selection: { anchor: line.to + insert.length - 1 }, scrollIntoView: true });
  });

  // Adds an entry at the end of the :::quiz or :::glossary section, creating the section if there isn't one
  const addToSection = (name: 'quiz' | 'glossary', entry: string) => withEditor(view => {
    const doc = view.state.doc.toString();
    const opening = doc.match(new RegExp(`^:::${name}[ \\t]*$`, 'm'));
    const closing = opening?.index === undefined ? null : /^:::[ \t]*$/m.exec(doc.slice(opening.index + opening[0].length));
    if (opening?.index !== undefined && closing) {
      const at = opening.index + opening[0].length + closing.index;
      const insert = name === 'quiz' ? `\n${entry}\n` : `${entry}\n`;
      view.dispatch({ changes: { from: at, insert }, selection: { anchor: at + (name === 'quiz' ? 1 : 0) }, scrollIntoView: true });
      return;
    }
    const insert = `${doc.endsWith('\n') ? '' : '\n'}\n:::${name}\n${entry}\n:::\n`;
    view.dispatch({ changes: { from: doc.length, insert }, selection: { anchor: doc.length + insert.indexOf(entry) }, scrollIntoView: true });
  });

  const goToLine = (lineNumber: number) => withEditor(view => {
    const line = view.state.doc.line(Math.min(Math.max(lineNumber, 1), view.state.doc.lines));
    view.dispatch({ selection: { anchor: line.from }, scrollIntoView: true });
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post<{ fileId: string }>('/admin/images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      insertBlock(`::image{file=${res.data.fileId} width=80 align=center alt="" caption=""}`);
      notify('success', 'Image uploaded. Add its alt text and caption in the ::image line.');
    } catch {
      notify('error', 'Image upload failed. Images must be PNG, JPEG, GIF or WebP.');
    } finally {
      setUploading(false);
    }
  };

  // --- Links, AI and files ---

  const applyLinks = (questionIndex: number, blockIndices: number[]) => {
    let next = source;
    const taken = new Set(lesson.blocks.flatMap(b => (b.id ? [b.id] : [])));
    const labels = blockIndices.map(index => {
      const block = lesson.blocks[index];
      if (block.id) return block.id;
      const label = newLabel(block, taken);
      taken.add(label);
      next = addBlockLabel(next, index, label);
      return label;
    });
    onChange({ source: setQuestionReview(next, questionIndex, labels) });
    setLinkingQuestion(null);
  };

  const copyForAi = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt(title, source));
      notify('success', 'Copied the lesson with its format guide. Paste it into your AI assistant, then use Paste from AI.');
    } catch {
      notify('error', "Couldn't copy to the clipboard.");
    }
  };

  const downloadMarkdown = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([source], { type: 'text/markdown' }));
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson'}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const uploadMarkdown = async (file: File) => {
    onChange({ source: await file.text() });
    notify('success', `Loaded ${file.name}. Review it, then save.`);
  };

  const tabCls = (active: boolean) => `
    cursor-pointer border-none border-b-2 bg-transparent px-4 py-2 font-inter text-sm
    font-medium
    ${active ? 'border-b-[#60a5fa] text-[#F9FAFB]' : 'border-b-transparent text-[#9DA7B7]'}
  `;

  const errorCount = lesson.problems.length;

  return (
    <div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void uploadImage(file); }}
      />
      <input
        ref={markdownInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void uploadMarkdown(file); }}
      />

      <label className={labelCls} htmlFor={`lesson-title-${lessonId}`}>Lesson title</label>
      <input
        id={`lesson-title-${lessonId}`}
        value={title}
        onChange={e => onChange({ title: e.target.value })}
        className={`
          ${inputCls}
          text-base font-semibold
        `}
      />
      <p className={hintCls}>Shown at the top of the lesson page.</p>

      <div className="mt-4 mb-3 flex gap-0 border-b border-brand-border-dark">
        <button className={tabCls(tab === 'write')} onClick={() => setTab('write')}>Write</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')} disabled={!exists}>
          History
        </button>
      </div>

      {tab === 'history' && exists && (
        <RevisionHistory
          lessonId={lessonId}
          version={version}
          onLoad={(loadedTitle, loadedSource) => {
            onChange({ title: loadedTitle, source: loadedSource });
            setTab('write');
            notify('success', 'Loaded the earlier version. Save to restore it.');
          }}
        />
      )}

      {tab === 'write' && (
        <>
          <div className="
            mb-2 flex flex-wrap items-center gap-1 rounded-md border
            border-brand-border-dark bg-[#0d1a30] px-2 py-1
          " role="toolbar" aria-label="Formatting">
            <button className={toolBtnCls} onClick={() => setLinePrefix('# ')} title="Heading (# at the start of a line)">Heading</button>
            <button className={toolBtnCls} onClick={() => setLinePrefix('## ')} title="Subheading (## at the start of a line)">Subheading</button>
            <button className={`
              ${toolBtnCls}
              font-bold
            `} onClick={() => wrapSelection('**', '**', 'bold text')} title="Bold (**text**)">B</button>
            <button className={`
              ${toolBtnCls}
              italic
            `} onClick={() => wrapSelection('*', '*', 'italic text')} title="Italic (*text*)">I</button>
            <button className={toolBtnCls} onClick={() => wrapSelection('$', '$', '\\ket{\\psi}')} title="Inline math ($…$)">$x$ Math</button>
            <button className={toolBtnCls} onClick={() => insertBlock('$$\n\\ket{\\psi} = \\alpha\\ket{0} + \\beta\\ket{1}\n$$')} title="Display math ($$…$$ on its own lines)">$$ Equation</button>
            <button className={toolBtnCls} onClick={() => imageInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Image'}
            </button>
            <button className={toolBtnCls} onClick={() => addToSection('quiz', QUESTION_TEMPLATE)}>+ Question</button>
            <button className={toolBtnCls} onClick={() => addToSection('glossary', '- **term**: What the term means.')}>+ Glossary term</button>
            <span className="flex-1" />
            <button className={secondaryBtnCls} onClick={() => { void copyForAi(); }} title="Copy the lesson and a format guide for an AI assistant">
              Copy for AI
            </button>
            <button className={secondaryBtnCls} onClick={() => setPasting(true)}>Paste from AI</button>
            <RowMenu
              label="the lesson source"
              actions={[
                { label: 'Download .md', onSelect: downloadMarkdown },
                { label: 'Upload .md…', onSelect: () => markdownInputRef.current?.click() },
              ]}
            />
          </div>

          <div className="
            grid gap-4
            xl:grid-cols-2
          ">
            <div className="min-w-0">
              <div className="
                overflow-hidden rounded-md border border-brand-border-dark
              ">
                <CodeMirror
                  ref={editorRef}
                  value={source}
                  onChange={value => onChange({ source: value })}
                  extensions={EXTENSIONS}
                  theme="dark"
                  height="65vh"
                  basicSetup={{ foldGutter: false }}
                  aria-label="Lesson source"
                />
              </div>
              <div className="mt-2 text-[13px]" aria-live="polite">
                {errorCount === 0 ? (
                  <p className="m-0 text-success">No problems. Ready to save.</p>
                ) : (
                  <>
                    <p className="m-0 mb-1 text-error">
                      {errorCount} problem{errorCount === 1 ? '' : 's'} to fix before this lesson can be saved:
                    </p>
                    <ul className="m-0 list-none space-y-0.5 p-0">
                      {lesson.problems.map((problem, i) => (
                        <li key={i}>
                          <button
                            onClick={() => goToLine(problem.line)}
                            className="
                              cursor-pointer border-none bg-transparent p-0
                              text-left text-[13px] text-[#fca5a5]
                              hover:underline
                            "
                          >
                            Line {problem.line}: {problem.message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            <div className="
              max-h-[75vh] min-w-0 overflow-y-auto rounded-md border
              border-brand-border-dark bg-brand-bg p-6
            " aria-label="Preview">
              <LessonPreview title={title} lesson={lesson} onLinkQuestion={setLinkingQuestion} />
            </div>
          </div>
        </>
      )}

      {linkingQuestion !== null && linkingQuestion < lesson.quiz.length && (
        <LinkContentDialog
          questionNumber={linkingQuestion + 1}
          blocks={lesson.blocks}
          linkedLabels={lesson.quiz[linkingQuestion].lessonBlockIds ?? []}
          onApply={indices => applyLinks(linkingQuestion, indices)}
          onClose={() => setLinkingQuestion(null)}
        />
      )}
      {pasting && (
        <PasteFromAiDialog
          current={lesson}
          onClose={() => setPasting(false)}
          onReplace={(pastedTitle, pastedSource) => {
            onChange(pastedTitle ? { title: pastedTitle, source: pastedSource } : { source: pastedSource });
            setPasting(false);
            notify('success', 'Replaced the lesson in the editor. Check the preview, then save.');
          }}
        />
      )}
    </div>
  );
};

export default LessonEditor;
