// Unified lesson/content type definitions.

// A lesson as the student dashboard and the quiz use it
export interface LessonContent {
  title: string;
  blocks: ContentBlock[];
  interactiveTerms?: Record<string, string>;
}

// Paragraph text is Markdown with TeX math ($…$, $$…$$). `id` is the block's label ({#label} in the lesson
// source), which quiz questions use to point at the content they review.
export interface ContentBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'image';
  id?: string;
  text?: string;
  fileId?: string;
  caption?: string;
  alt?: string;
  align?: 'center' | 'left' | 'right';
  width?: number;
}
