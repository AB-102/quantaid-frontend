// Course structure types used by Dashboard.

export interface Topic {
  id: number;
  title: string;
  description?: string;
  implemented?: boolean;
}

export interface Concept {
  id: string;
  title: string;
  topics: Topic[];
  icon?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  concepts: Concept[];
}

// A row of courses on the student dashboard
export interface DashboardSection {
  id: string;
  title: string;
  order: number;
  courses: number[]; // course ids, in display order
}

export interface DashboardConfig {
  sections: DashboardSection[];
  courses: Course[];
}

export interface CompletedQuiz {
  courseId: number;
  score: number;
  passed: boolean;
  timestamp: string;
}
