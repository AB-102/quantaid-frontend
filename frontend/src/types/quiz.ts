// Unified quiz type definitions.

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  // Labels (block ids) of the lesson content "Review lesson content" shows for this question
  lessonBlockIds?: string[];
}

export interface AllQuizData {
  [courseId: number]: Question[];
}
