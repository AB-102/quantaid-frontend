// The pictures a course card can use. The dashboard config stores the key; students see the image.

import lesson0Img from '@/assets/lessonIcons/lesson-0.svg';
import lesson1Img from '@/assets/lessonIcons/lesson-1.svg';
import lesson2Img from '@/assets/lessonIcons/lesson-2.svg';

export const COURSE_IMAGES = [
  { key: 'lesson-0', label: 'Quantum Blue', src: lesson0Img },
  { key: 'lesson-1', label: 'Quantum Purple', src: lesson1Img },
  { key: 'lesson-2', label: 'Quantum Green', src: lesson2Img },
];

// An unknown key shows the first picture
export const courseImageSrc = (key: string): string =>
  (COURSE_IMAGES.find(image => image.key === key) ?? COURSE_IMAGES[0]).src;
