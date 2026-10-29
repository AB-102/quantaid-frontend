// A lesson's source document: Markdown with TeX math, {#labels}, ::image lines and :::quiz / :::glossary sections.
// It's a view over the stored lesson (blocks, quiz, glossary), parsed with the same Markdown grammar students'
// lessons render with. Each block keeps its original source text, so converting back and forth loses nothing.
//
//   # Heading                         -> heading block (## -> subheading)
//   ## Superposition {#superposition}  -> a labelled block; quiz questions review it by label
//   Any other Markdown                 -> paragraph block (lists, tables, $math$, $$display math$$, ### …)
//   {#label} on its own line           -> labels the block above it
//   ::image{file=… width=80 align=center alt="…" caption="…"} -> image block
//   :::quiz … :::                      -> questions: "### question", "review: #label", "- [ ]"/"- [x]" options, "> explanation"
//   :::glossary … :::                  -> "- **term**: definition" entries (interactiveTerms)

import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { ContentBlock } from '@/types/lesson';
import type { Question } from '@/types/quiz';

export interface LessonDocument {
  blocks: ContentBlock[];
  quiz: Question[];
  interactiveTerms: Record<string, string>;
}

export interface SourceProblem {
  line: number;
  message: string;
}

export interface TextRange {
  start: number;
  end: number;
  line: number;
}

interface QuestionRange {
  heading: TextRange;
  review: TextRange | null;
}

export interface ParsedLesson extends LessonDocument {
  // Anything here keeps the lesson from saving
  problems: SourceProblem[];
  // Where each block and question sits in the source, for edits like adding a label
  blockRanges: TextRange[];
  questionRanges: QuestionRange[];
}

// The same rule the backend checks (core/quiz_links.py)
const LABEL_PATTERN = /^[a-z0-9][a-z0-9:_-]*$/;
const LABEL_RULE = 'use lowercase letters, digits, "-", "_" or ":"';
const IMAGE_ALIGNS = ['center', 'left', 'right'] as const;

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkDirective);

interface Positioned {
  position?: { start: { line: number; offset?: number }; end: { offset?: number } };
}

const rangeOf = (node: Positioned): TextRange => ({
  start: node.position?.start.offset ?? 0,
  end: node.position?.end.offset ?? 0,
  line: node.position?.start.line ?? 1,
});

const headingText = (text: string): string => text.replace(/^#+[ \t]*/, '').replace(/[ \t]+#+[ \t]*$/, '').trim();

const isImageAlign = (value: string): value is (typeof IMAGE_ALIGNS)[number] =>
  IMAGE_ALIGNS.some(align => align === value);

function readQuiz(
  children: Positioned[],
  types: string[],
  source: string,
  lesson: ParsedLesson,
  problem: (line: number, message: string) => void,
) {
  let current: { question: Question; range: QuestionRange; correct: number[] } | null = null;

  const finish = () => {
    if (!current) return;
    const number = lesson.quiz.length + 1;
    const { question, range, correct } = current;
    if (!question.question) problem(range.heading.line, `Question ${number} has no text after "###"`);
    if (question.options.length < 2) problem(range.heading.line, `Question ${number} needs at least two options`);
    if (correct.length !== 1) {
      problem(range.heading.line, `Question ${number} needs exactly one correct option, marked "- [x]"`);
    }
    question.correctAnswer = correct[0] ?? 0;
    lesson.quiz.push(question);
    lesson.questionRanges.push(range);
    current = null;
  };

  children.forEach((child, i) => {
    const type = types[i];
    const range = rangeOf(child);
    const text = source.slice(range.start, range.end);
    if (type === 'heading') {
      finish();
      current = { question: { question: headingText(text), options: [], correctAnswer: 0 }, range: { heading: range, review: null }, correct: [] };
      return;
    }
    if (!current) {
      problem(range.line, 'Start each question with a "### " line');
      return;
    }
    if (type === 'paragraph' && /^review:/i.test(text)) {
      const tokens = text.slice('review:'.length).trim().split(/\s+/).filter(Boolean);
      const bad = tokens.filter(token => !token.startsWith('#'));
      if (bad.length > 0) problem(range.line, `Write reviewed labels as #label, e.g. "review: #superposition"`);
      current.question.lessonBlockIds = tokens.filter(token => token.startsWith('#')).map(token => token.slice(1));
      current.range.review = range;
      return;
    }
    if (type === 'list') {
      // Each option's text runs from its first line to its last, minus the "[ ]" / "[x]" box
      for (const optionLine of text.split(/\n(?=[-*+] )/)) {
        const match = optionLine.match(/^[-*+] \[([ xX])\] ?([\s\S]*)$/);
        if (!match) {
          problem(range.line, 'Write options as "- [ ] option", with "- [x]" for the correct one');
          continue;
        }
        if (match[1] !== ' ') current.correct.push(current.question.options.length);
        current.question.options.push(match[2].trim());
      }
      return;
    }
    if (type === 'blockquote') {
      current.question.explanation = text.split('\n').map(line => line.replace(/^>[ ]?/, '')).join('\n').trim();
      return;
    }
    problem(range.line, 'In the quiz, a question has a "review:" line, "- [ ]" options and a "> explanation"');
  });
  finish();
}

function readGlossary(
  children: Positioned[],
  types: string[],
  source: string,
  lesson: ParsedLesson,
  problem: (line: number, message: string) => void,
) {
  children.forEach((child, i) => {
    const range = rangeOf(child);
    if (types[i] !== 'list') {
      problem(range.line, 'Write glossary entries as "- **term**: definition"');
      return;
    }
    for (const entry of source.slice(range.start, range.end).split(/\n(?=[-*+] )/)) {
      const match = entry.match(/^[-*+] \*\*(.+?)\*\*\s*:\s*([\s\S]+)$/);
      if (!match) {
        problem(range.line, 'Write glossary entries as "- **term**: definition"');
        continue;
      }
      const term = match[1].trim();
      if (term in lesson.interactiveTerms) problem(range.line, `The glossary defines "${term}" twice`);
      lesson.interactiveTerms[term] = match[2].trim().replace(/\s*\n\s*/g, ' ');
    }
  });
}

export function sourceToLesson(source: string): ParsedLesson {
  const lesson: ParsedLesson = { blocks: [], quiz: [], interactiveTerms: {}, problems: [], blockRanges: [], questionRanges: [] };
  const problem = (line: number, message: string) => lesson.problems.push({ line, message });
  const labelLines = new Map<string, number>();
  let sections = { quiz: false, glossary: false };

  const addBlock = (block: ContentBlock, range: TextRange) => {
    lesson.blocks.push(block);
    lesson.blockRanges.push(range);
  };

  const setLabel = (block: ContentBlock, label: string, line: number) => {
    if (!LABEL_PATTERN.test(label)) {
      problem(line, `Label {#${label}}: ${LABEL_RULE}`);
      return;
    }
    if (labelLines.has(label)) {
      problem(line, `Label {#${label}} is already used on line ${labelLines.get(label)}`);
      return;
    }
    labelLines.set(label, line);
    block.id = label;
  };

  for (const node of parser.parse(source).children) {
    const range = rangeOf(node);
    const text = source.slice(range.start, range.end);

    if (node.type === 'heading' && node.depth <= 2) {
      const match = headingText(text).match(/^([\s\S]*?)\s*\{#([^}]*)\}$/);
      const block: ContentBlock = { type: node.depth === 1 ? 'heading' : 'subheading', text: match ? match[1] : headingText(text) };
      if (!block.text) problem(range.line, 'This heading has no text');
      if (match) setLabel(block, match[2], range.line);
      addBlock(block, range);
      continue;
    }

    if (node.type === 'leafDirective' && node.name === 'image') {
      const attributes = node.attributes ?? {};
      const block: ContentBlock = { type: 'image', fileId: attributes.file ?? '', align: 'center', width: 80 };
      if (!block.fileId) problem(range.line, '::image needs file=…, the id of an uploaded image');
      if (attributes.alt) block.alt = attributes.alt;
      if (attributes.caption) block.caption = attributes.caption;
      if (attributes.align) {
        if (isImageAlign(attributes.align)) block.align = attributes.align;
        else problem(range.line, 'align must be center, left or right');
      }
      if (attributes.width) {
        const width = Number(attributes.width);
        if (Number.isInteger(width) && width >= 10 && width <= 100) block.width = width;
        else problem(range.line, 'width is a percentage from 10 to 100');
      }
      if (attributes.id) setLabel(block, attributes.id, range.line);
      addBlock(block, range);
      continue;
    }

    if (node.type === 'containerDirective' && (node.name === 'quiz' || node.name === 'glossary')) {
      if (!text.trimEnd().endsWith(':::')) problem(range.line, `The :::${node.name} section needs a closing ::: line`);
      if (sections[node.name]) problem(range.line, `There's already a :::${node.name} section`);
      sections = { ...sections, [node.name]: true };
      const types = node.children.map(child => child.type);
      if (node.name === 'quiz') readQuiz(node.children, types, source, lesson, problem);
      else readGlossary(node.children, types, source, lesson, problem);
      continue;
    }

    if (node.type === 'containerDirective' || node.type === 'leafDirective') {
      problem(range.line, `Unknown section "${text.split('\n')[0]}": use ::image, :::quiz or :::glossary`);
      continue;
    }

    if (node.type === 'html') {
      problem(range.line, "HTML isn't shown to students; write it in Markdown");
      continue;
    }

    // {#label} on its own line labels the block above it
    const labelOnly = text.match(/^\{#([^}]*)\}$/);
    if (labelOnly) {
      const previous = lesson.blocks.at(-1);
      if (!previous) problem(range.line, 'A label goes right after the block it labels');
      else if (previous.id) problem(range.line, `The block above already has the label {#${previous.id}}`);
      else setLabel(previous, labelOnly[1], range.line);
      continue;
    }

    // Any other Markdown is a paragraph block. A label on the line right after it is part of the same node.
    const trailing = text.match(/^([\s\S]*?)\n\{#([^}]*)\}$/);
    const block: ContentBlock = { type: 'paragraph', text: trailing ? trailing[1] : text };
    if (trailing) setLabel(block, trailing[2], range.line);
    addBlock(block, range);
  }

  lesson.quiz.forEach((question, i) => {
    for (const label of question.lessonBlockIds ?? []) {
      if (!labelLines.has(label)) {
        const line = lesson.questionRanges[i].review?.line ?? lesson.questionRanges[i].heading.line;
        problem(line, `Question ${i + 1} reviews #${label}, but no block has the label {#${label}}`);
      }
    }
  });
  if (lesson.blocks.length === 0) problem(1, 'The lesson has no content yet');
  lesson.problems.sort((a, b) => a.line - b.line);
  return lesson;
}

const oneLine = (text: string): string => text.replace(/\s*\n\s*/g, ' ').trim();

const quoteAttribute = (value: string): string => `"${value.replace(/"/g, '&quot;')}"`;

export function lessonToSource({ blocks, quiz, interactiveTerms }: LessonDocument): string {
  const parts = blocks.map(block => {
    const labelLine = block.id ? `\n\n{#${block.id}}` : '';
    if (block.type === 'heading' || block.type === 'subheading') {
      const marker = block.type === 'heading' ? '#' : '##';
      return `${marker} ${oneLine(block.text ?? '')}${block.id ? ` {#${block.id}}` : ''}`;
    }
    if (block.type === 'image') {
      const attributes = [
        `file=${block.fileId ?? ''}`,
        `width=${block.width ?? 80}`,
        `align=${block.align ?? 'center'}`,
        ...(block.alt ? [`alt=${quoteAttribute(block.alt)}`] : []),
        ...(block.caption ? [`caption=${quoteAttribute(block.caption)}`] : []),
      ];
      return `::image{${attributes.join(' ')}}${labelLine}`;
    }
    return `${block.text ?? ''}${labelLine}`;
  });

  if (quiz.length > 0) {
    const questions = quiz.map(question => [
      `### ${oneLine(question.question)}`,
      ...(question.lessonBlockIds?.length ? [`review: ${question.lessonBlockIds.map(label => `#${label}`).join(' ')}`] : []),
      ...question.options.map((option, i) => `- [${i === question.correctAnswer ? 'x' : ' '}] ${oneLine(option)}`),
      ...(question.explanation ? question.explanation.split('\n').map(line => `> ${line}`) : []),
    ].join('\n'));
    parts.push(`:::quiz\n${questions.join('\n\n')}\n:::`);
  }

  const terms = Object.entries(interactiveTerms);
  if (terms.length > 0) {
    parts.push(`:::glossary\n${terms.map(([term, definition]) => `- **${term}**: ${oneLine(definition)}`).join('\n')}\n:::`);
  }

  return parts.join('\n\n') + '\n';
}

// A one-line description of a block, for lists like the link picker
export const blockSnippet = (block: ContentBlock): string => {
  if (block.type === 'image') return `Image${block.caption ? `: ${block.caption}` : ''}`;
  const text = (block.text ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 110 ? `${text.slice(0, 107)}…` : text;
};

// A readable label for a block: a heading's words or a paragraph's first few, unique in the lesson.
// The same scheme as the backend's migration (core/quiz_links.py).
export function newLabel(block: ContentBlock, taken: Set<string>): string {
  const maxWords = block.type === 'heading' || block.type === 'subheading' ? 6 : 4;
  const words = (block.type === 'image' ? block.caption ?? block.alt ?? '' : block.text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const base = words.slice(0, maxWords).join('-') || (block.type === 'image' ? 'image' : 'block');
  let label = base;
  for (let suffix = 2; taken.has(label); suffix++) label = `${base}-${suffix}`;
  return label;
}

// Adds {#label} to the block at `index`, which has no label yet
export function addBlockLabel(source: string, index: number, label: string): string {
  const { blocks, blockRanges } = sourceToLesson(source);
  const block = blocks[index];
  const { end } = blockRanges[index];
  if (block.type === 'heading' || block.type === 'subheading') {
    return `${source.slice(0, end)} {#${label}}${source.slice(end)}`;
  }
  return `${source.slice(0, end)}\n\n{#${label}}${source.slice(end)}`;
}

// Sets which labels the question at `index` reviews, adding, replacing or removing its "review:" line
export function setQuestionReview(source: string, index: number, labels: string[]): string {
  const { heading, review } = sourceToLesson(source).questionRanges[index];
  const line = `review: ${labels.map(label => `#${label}`).join(' ')}`;
  if (review) {
    if (labels.length > 0) return source.slice(0, review.start) + line + source.slice(review.end);
    return source.slice(0, review.start) + source.slice(review.end).replace(/^\n/, '');
  }
  if (labels.length === 0) return source;
  return `${source.slice(0, heading.end)}\n${line}${source.slice(heading.end)}`;
}
