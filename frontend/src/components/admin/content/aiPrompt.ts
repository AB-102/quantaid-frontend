// What "Copy for AI" puts in front of a lesson, so an outside assistant answers in the lesson source format,
// and the clean-up "Paste from AI" does on its reply.

const FORMAT_GUIDE = `You're helping edit a lesson for Quantaid, an introductory quantum computing course.
Reply with the complete revised lesson in exactly this format, and nothing else.

- "# " starts a heading and "## " a subheading. Everything else is Markdown: paragraphs, **bold**, *italic*, lists, tables.
- Math is TeX: $...$ inline, and $$...$$ on lines of its own. KaTeX renders it, so use commands it supports, such as \\ket{\\psi}, \\bra{\\phi}, \\braket{\\phi|\\psi}, \\frac, \\sqrt and \\otimes.
- {#label} at the end of a heading line, or on its own line right after a block, labels that block. Keep each existing label with the content it describes: quiz questions point at them.
- ::image{...} lines are uploaded images. Keep them exactly as they are; you may move them.
- The :::quiz section holds the quiz. Each question is a "### " line, then optionally "review: #label #label" naming the labelled content it tests, then its options as "- [ ] wrong answer" and "- [x] correct answer" (exactly one [x]), then optionally "> explanation".
- The :::glossary section lists "- **term**: definition" entries. Terms are underlined where they first appear in the lesson.
- Each ::: section ends with a line holding only :::.`;

export function aiPrompt(title: string, source: string): string {
  return `${FORMAT_GUIDE}\n\nLesson title: ${title}\n\n${source}`;
}

// Assistants often wrap their answer in a code block, and may repeat the title line: take both off
export function readAiReply(reply: string): { title: string | null; source: string } {
  let text = reply.trim();
  const fenced = text.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
  if (fenced) text = fenced[1];
  let title: string | null = null;
  const titleLine = text.match(/^Lesson title:[ \t]*(.+)\n+/i);
  if (titleLine) {
    title = titleLine[1].trim();
    text = text.slice(titleLine[0].length);
  }
  return { title, source: `${text.trim()}\n` };
}
