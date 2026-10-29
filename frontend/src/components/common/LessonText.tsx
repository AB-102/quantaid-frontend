// src/components/common/LessonText.tsx
// Renders lesson Markdown with TeX math ($…$ inline, $$…$$ on its own lines), exactly as students see it.
// Raw HTML stays off (no rehype-raw) and react-markdown's URL sanitising stays on.

import 'katex/dist/katex.min.css';
import React, { useId } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { rehypeGlossary } from './glossary';

interface LessonTextProps {
  markdown: string;
  // For text inside buttons and headings: paragraphs render as spans
  inline?: boolean;
  // Glossary terms to underline, with their definitions
  terms?: Record<string, string>;
}

// Tailwind's reset removes the browser's Markdown styles, so lists, quotes, tables and code get them back here
const blockClass = `
  [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto
  [&_.katex-display]:overflow-y-hidden
  [&_a]:text-brand-sky [&_a]:underline
  [&_blockquote]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-border
  [&_blockquote]:pl-4 [&_blockquote]:text-brand-subtle
  [&_code]:rounded-sm [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-mono
  [&_code]:text-[0.9em]
  [&_em]:italic
  [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-[1.1rem] [&_h3]:font-semibold
  [&_li]:mb-1
  [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6
  [&_p]:mb-3
  [&_p:last-child]:mb-0
  [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/30
  [&_pre]:p-3
  [&_strong]:font-semibold
  [&_table]:mb-3 [&_table]:border-collapse
  [&_td]:border [&_td]:border-brand-border [&_td]:px-3 [&_td]:py-1
  [&_th]:border [&_th]:border-brand-border [&_th]:px-3 [&_th]:py-1
  [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6
`;

// remark-math only displays $$…$$ as a block when the $$ are on lines of their own, but a line that's just
// "$$x = 1$$" is how equations are usually written, so it's displayed as a block too
const displayOneLineMath = (text: string): string =>
  text.replace(/^[ \t]*\$\$([^\n$]+)\$\$[ \t]*$/gm, (_line, math: string) => `$$\n${math.trim()}\n$$`);

// Inline text (a heading, a quiz option) is one line: a leading "1." or "-" is text, not the start of a list
const escapeBlockSyntax = (text: string): string =>
  text.trim().replace(/^(\d+)([.)])(\s)/, '$1\\$2$3').replace(/^([-+*>#])(\s)/, '\\$1$2');

const GlossaryTerm: React.FC<{ definition: string; children: React.ReactNode }> = ({ definition, children }) => {
  const tooltipId = useId();
  return (
    <dfn
      tabIndex={0}
      aria-describedby={tooltipId}
      className="
        group relative cursor-help not-italic underline decoration-dotted
        underline-offset-4
        focus-visible:outline-2 focus-visible:outline-brand-focus
      "
    >
      {children}
      {/* display:none until hovered or focused, so it's left out of selected text */}
      <span
        role="tooltip"
        id={tooltipId}
        className="
          absolute top-full left-1/2 z-10 mt-1 hidden w-64 -translate-x-1/2
          rounded-md bg-brand-slate px-3 py-2 text-left text-sm/snug font-normal
          text-[#E8E3F3] shadow-lg
          group-hover:block
          group-focus:block
        "
      >
        {definition}
      </span>
    </dfn>
  );
};

const LessonText: React.FC<LessonTextProps> = ({ markdown, inline = false, terms = {} }) => {
  const components: Components = {
    a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    dfn: ({ node, children }) => {
      const term = node?.properties.dataTerm;
      const definition = typeof term === 'string' ? terms[term] : undefined;
      return definition ? <GlossaryTerm definition={definition}>{children}</GlossaryTerm> : <dfn>{children}</dfn>;
    },
  };
  if (inline) {
    components.p = ({ children }) => <span>{children}</span>;
  }

  const content = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false }], [rehypeGlossary, Object.keys(terms)]]}
      components={components}
    >
      {inline ? escapeBlockSyntax(markdown) : displayOneLineMath(markdown)}
    </ReactMarkdown>
  );

  return inline ? <span>{content}</span> : <div className={blockClass}>{content}</div>;
};

export default LessonText;
