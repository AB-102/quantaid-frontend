import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/api';
import type { Question } from '@/types/quiz';
import type { ContentBlock, LessonContent } from '@/types/lesson';
import type { CompletedQuiz, Course, DashboardConfig, DashboardSection } from '@/types/course';
import { courseImageSrc } from '@/constants/courseImages';

interface UseDashboardDataOptions {
  currentLesson: number | null;
}

export interface UseDashboardDataReturn {
  contentError: unknown;
  userEmail: string | null;
  userName: string;
  userPicture: string;
  isLoadingProgress: boolean;
  completedQuizzes: CompletedQuiz[];
  hasViewedFirstLesson: boolean;
  setHasViewedFirstLesson: React.Dispatch<React.SetStateAction<boolean>>;
  activeCourses: Course[];
  activeSections: DashboardSection[];
  currentQuiz: Question[];
  currentLessonContent: LessonContent | undefined;
  fetchUserProgress: () => Promise<void>;
  saveFirstLessonView: () => Promise<void>;
  getCourseProgress: (courseId: number) => number;
  isCourseUnlocked: (courseId: number) => boolean;
  isTopicUnlocked: (topicId: number) => boolean;
}

/**
 * Manages all API data fetching (user progress, lesson content, dashboard config)
 * and derived progress computations (course unlock, topic unlock, progress %).
 */
export function useDashboardData({ currentLesson }: UseDashboardDataOptions): UseDashboardDataReturn {
  const [contentError, setContentError] = useState<unknown>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [completedQuizzes, setCompletedQuizzes] = useState<CompletedQuiz[]>([]);
  const [hasViewedFirstLesson, setHasViewedFirstLesson] = useState(false);

  // API lesson data for current lesson
  const [apiQuiz, setApiQuiz] = useState<Question[] | null>(null);
  const [apiLessonContent, setApiLessonContent] = useState<LessonContent | null>(null);

  useEffect(() => {
    if (currentLesson === null) {
      setApiQuiz(null);
      setApiLessonContent(null);
      return;
    }
    let cancelled = false;
    api.get(`/lessons/${currentLesson}`)
      .then(res => res.data)
      .then(data => {
        if (cancelled) return;
        if (data.quiz && data.quiz.length > 0) {
          setApiQuiz(data.quiz);
        }
        if (data.blocks) {
          const blocks: ContentBlock[] = data.blocks;
          setApiLessonContent({
            title: data.title,
            blocks,
            interactiveTerms: data.interactiveTerms || {},
          });
        }
      })
      .catch((err: unknown) => { setContentError(err); });
    return () => { cancelled = true; };
  }, [currentLesson]);

  // Dashboard config (sections/courses from API)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard-config')
      .then(res => res.data)
      .then(data => {
        if (cancelled || !data) return;
        const mappedCourses = (data.courses || []).map((c: Course) => ({
          ...c,
          image: courseImageSrc(c.image),
        }));
        setDashboardConfig({ sections: data.sections || [], courses: mappedCourses });
      })
      .catch((err: unknown) => { setContentError(err); });
    return () => { cancelled = true; };
  }, []);

  const activeCourses: Course[] = useMemo(() => dashboardConfig?.courses ?? [], [dashboardConfig]);
  const activeSections: DashboardSection[] = useMemo(() => dashboardConfig?.sections ?? [], [dashboardConfig]);

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    console.log("Fetching user progress...");
    setIsLoadingProgress(true);
    try {
      const response = await api.get('/me/progress');
      const data = response.data;
      console.log("Progress data received:", data);
      setCompletedQuizzes(data.completedQuizzes || []);
      setHasViewedFirstLesson(data.hasViewedFirstLesson || false);
      if (data.email) setUserEmail(data.email);
      if (data.name) setUserName(data.name);
      if (data.picture) setUserPicture(data.picture);
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      setCompletedQuizzes([]);
      setHasViewedFirstLesson(false);
    } finally {
      setIsLoadingProgress(false);
    }
  }, []);

  const saveFirstLessonView = useCallback(async () => {
    try {
      await api.put('/me/onboarding', { hasViewedFirstLesson: true });
      console.log("First lesson view saved successfully");
    } catch (error) {
      console.error('Failed to save first lesson view:', error);
    }
  }, []);

  // Fetch progress on mount
  useEffect(() => {
    void fetchUserProgress();
  }, [fetchUserProgress]);

  // Progress computations
  const getCourseProgress = useCallback((courseId: number): number => {
    const course = activeCourses.find(c => c.id === courseId);
    if (!course || course.concepts.length === 0) return 0;

    const implementedTopics = course.concepts.reduce((sum, concept) => {
      return sum + concept.topics.filter(topic => topic.implemented ?? true).length;
    }, 0);

    if (implementedTopics === 0) return 0;

    const completedImplementedTopics = course.concepts.reduce((sum, concept) => {
      return sum + concept.topics.filter(topic => {
        const isImplemented = topic.implemented ?? true;
        const isCompleted = completedQuizzes.some(quiz => quiz.courseId === topic.id && quiz.passed);
        return isImplemented && isCompleted;
      }).length;
    }, 0);

    return Math.round((completedImplementedTopics / implementedTopics) * 100);
  }, [completedQuizzes, activeCourses]);

  // Courses unlock in the order students see them (sections by order, then each section's course list): a course
  // opens once the nearest earlier course with a published topic is complete. Courses with nothing published yet
  // don't hold the next one back.
  const isCourseUnlocked = useCallback((courseId: number): boolean => {
    const orderedCourseIds = [...activeSections].sort((a, b) => a.order - b.order).flatMap(s => s.courses);
    const position = orderedCourseIds.indexOf(courseId);
    if (position === -1) return false;
    for (let i = position - 1; i >= 0; i--) {
      const previous = activeCourses.find(c => c.id === orderedCourseIds[i]);
      const hasPublishedTopic = previous?.concepts.some(concept => concept.topics.some(t => t.implemented ?? true));
      if (previous && hasPublishedTopic) return getCourseProgress(previous.id) === 100;
    }
    return true;
  }, [getCourseProgress, activeCourses, activeSections]);

  const isTopicUnlocked = useCallback((topicId: number): boolean => {
    let topicImplemented = true;
    for (const course of activeCourses) {
      for (const concept of course.concepts) {
        const topic = concept.topics.find(t => t.id === topicId);
        if (topic) {
          topicImplemented = topic.implemented ?? true;
          break;
        }
      }
      if (!topicImplemented) break;
    }

    if (!topicImplemented) return false;

    for (const course of activeCourses) {
      for (const concept of course.concepts) {
        const topic = concept.topics.find(t => t.id === topicId);
        if (topic) {
          return isCourseUnlocked(course.id);
        }
      }
    }

    return false;
  }, [activeCourses, isCourseUnlocked]);

  // Resolved quiz/lesson content from API
  const currentQuiz: Question[] = currentLesson !== null ? (apiQuiz ?? []) : [];
  const currentLessonContent: LessonContent | undefined = currentLesson !== null
    ? (apiLessonContent ?? undefined)
    : undefined;

  return {
    contentError,
    userEmail,
    userName,
    userPicture,
    isLoadingProgress,
    completedQuizzes,
    hasViewedFirstLesson,
    setHasViewedFirstLesson,
    activeCourses,
    activeSections,
    currentQuiz,
    currentLessonContent,
    fetchUserProgress,
    saveFirstLessonView,
    getCourseProgress,
    isCourseUnlocked,
    isTopicUnlocked,
  };
}
