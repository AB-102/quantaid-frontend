import type { Question } from '@/types/quiz';
import { aiPrompt, readAiReply } from './aiPrompt';
import { addBlockLabel, type LessonDocument, lessonToSource, newLabel, setQuestionReview, sourceToLesson } from './lessonSource';
import lessons from './__fixtures__/lessons.json';

interface FixtureQuestion extends Question {
  lessonContentIndices?: number[];
}

// The editor drops the legacy positions and leaves out empty optional fields
const normalizeQuiz = (quiz: FixtureQuestion[]): Question[] =>
  quiz.map(({ lessonContentIndices: _positions, ...question }) => {
    const out: Question = { question: question.question, options: question.options, correctAnswer: question.correctAnswer };
    if (question.explanation) out.explanation = question.explanation;
    if (question.lessonBlockIds?.length) out.lessonBlockIds = question.lessonBlockIds;
    return out;
  });

// The JSON fixture types each lesson's glossary as a different object shape
const toDocument = (lesson: (typeof lessons)[number]): LessonDocument => ({
  blocks: lesson.blocks.map(block => ({ ...block, type: block.type === 'heading' || block.type === 'subheading' ? block.type : 'paragraph' })),
  quiz: lesson.quiz,
  interactiveTerms: Object.fromEntries(
    Object.entries(lesson.interactiveTerms).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  ),
});

const messages = (source: string): string[] => sourceToLesson(source).problems.map(p => p.message);

describe('lessonSource round trip', () => {
  it.each(lessons.map(lesson => [lesson.title, lesson] as const))('keeps "%s" intact', (_title, lesson) => {
    const document = toDocument(lesson);
    const source = lessonToSource(document);
    const parsed = sourceToLesson(source);

    expect(parsed.problems).toEqual([]);
    expect(parsed.blocks).toEqual(document.blocks);
    expect(parsed.quiz).toEqual(normalizeQuiz(lesson.quiz));
    expect(parsed.interactiveTerms).toEqual(document.interactiveTerms);
    expect(lessonToSource(parsed)).toBe(source);
  });
});

describe('sourceToLesson', () => {
  it('reads headings, Markdown and math, and labels', () => {
    const { blocks, problems } = sourceToLesson([
      '# Core Principles',
      '',
      '## Superposition {#superposition}',
      'A state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ with **complex** amplitudes.',
      '{#state}',
      '',
      '$$|\\alpha|^2 + |\\beta|^2 = 1$$',
      '',
      '{#normalization}',
      '',
      '| Gate | Matrix |',
      '|---|---|',
      '| X | $\\sigma_x$ |',
      '',
      '{#gates}',
      '',
      '- one',
      '- two',
      '{#list}',
    ].join('\n'));
    expect(problems).toEqual([]);
    expect(blocks.map(b => [b.type, b.id])).toEqual([
      ['heading', undefined],
      ['subheading', 'superposition'],
      ['paragraph', 'state'],
      ['paragraph', 'normalization'],
      ['paragraph', 'gates'],
      ['paragraph', 'list'],
    ]);
    expect(blocks[1].text).toBe('Superposition');
    expect(blocks[2].text).toBe('A state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ with **complex** amplitudes.');
    expect(blocks[3].text).toBe('$$|\\alpha|^2 + |\\beta|^2 = 1$$');
    expect(blocks[5].text).toBe('- one\n- two');
  });

  it('reads images, including quotes in a caption', () => {
    const source = lessonToSource({
      blocks: [{ type: 'image', fileId: 'abc123', width: 60, align: 'left', alt: 'A "Bloch" sphere', caption: 'Figure 1' }],
      quiz: [],
      interactiveTerms: {},
    });
    expect(sourceToLesson(source).blocks).toEqual([
      { type: 'image', fileId: 'abc123', width: 60, align: 'left', alt: 'A "Bloch" sphere', caption: 'Figure 1' },
    ]);
  });

  it('reads a quiz and a glossary', () => {
    const parsed = sourceToLesson([
      '## Superposition {#superposition}',
      '',
      ':::quiz',
      '### What does $H$ do to $\\ket{0}$?',
      'review: #superposition',
      '- [ ] Nothing',
      '- [x] Makes an equal superposition',
      '> $H\\ket{0} = \\frac{1}{\\sqrt{2}}(\\ket{0} + \\ket{1})$',
      ':::',
      '',
      ':::glossary',
      '- **qubit**: The basic unit of quantum information.',
      ':::',
    ].join('\n'));
    expect(parsed.problems).toEqual([]);
    expect(parsed.quiz).toEqual([{
      question: 'What does $H$ do to $\\ket{0}$?',
      options: ['Nothing', 'Makes an equal superposition'],
      correctAnswer: 1,
      explanation: '$H\\ket{0} = \\frac{1}{\\sqrt{2}}(\\ket{0} + \\ket{1})$',
      lessonBlockIds: ['superposition'],
    }]);
    expect(parsed.interactiveTerms).toEqual({ qubit: 'The basic unit of quantum information.' });
  });

  it.each([
    ['two correct options', 'Text\n\n:::quiz\n### Q?\n- [x] a\n- [x] b\n:::', 'exactly one correct option'],
    ['no correct option', 'Text\n\n:::quiz\n### Q?\n- [ ] a\n- [ ] b\n:::', 'exactly one correct option'],
    ['a single option', 'Text\n\n:::quiz\n### Q?\n- [x] a\n:::', 'at least two options'],
    ['an option without a box', 'Text\n\n:::quiz\n### Q?\n- a\n- [x] b\n:::', 'Write options as'],
    ['an unknown review label', 'Text\n\n:::quiz\n### Q?\nreview: #nope\n- [ ] a\n- [x] b\n:::', 'no block has the label {#nope}'],
    ['a duplicate label', '# A {#x}\n\n# B {#x}', 'already used on line 1'],
    ['an invalid label', '# A {#Bad Label}', 'Label {#Bad Label}'],
    ['an unclosed quiz', 'Text\n\n:::quiz\n### Q?\n- [ ] a\n- [x] b', 'needs a closing ::: line'],
    ['an empty lesson', '', 'no content yet'],
    ['an unknown section', '::video{file=a}', 'Unknown section'],
    ['raw HTML', '<div>hi</div>', "HTML isn't shown"],
    ['a bad glossary entry', 'Text\n\n:::glossary\n- qubit is a bit\n:::', 'Write glossary entries'],
  ])('reports %s', (_name, source, expected) => {
    expect(messages(source).some(message => message.includes(expected))).toBe(true);
  });

  it('gives problems their line numbers', () => {
    const { problems } = sourceToLesson('Intro\n\n:::quiz\n### Q?\nreview: #missing\n- [ ] a\n- [x] b\n:::');
    expect(problems).toEqual([{ line: 5, message: 'Question 1 reviews #missing, but no block has the label {#missing}' }]);
  });
});

describe('editing links', () => {
  const source = '## Superposition\n\nA qubit can be both.\n\n:::quiz\n### Q?\n- [ ] a\n- [x] b\n:::\n';

  it('labels a heading and a paragraph without changing their text', () => {
    let edited = addBlockLabel(source, 0, 'superposition');
    edited = addBlockLabel(edited, 1, 'both');
    const { blocks, problems } = sourceToLesson(edited);
    expect(problems).toEqual([]);
    expect(blocks).toEqual([
      { type: 'subheading', text: 'Superposition', id: 'superposition' },
      { type: 'paragraph', text: 'A qubit can be both.', id: 'both' },
    ]);
  });

  it('adds, replaces and removes a question\'s review line', () => {
    const labelled = addBlockLabel(addBlockLabel(source, 0, 'superposition'), 1, 'both');
    const added = setQuestionReview(labelled, 0, ['superposition']);
    expect(sourceToLesson(added).quiz[0].lessonBlockIds).toEqual(['superposition']);
    const replaced = setQuestionReview(added, 0, ['superposition', 'both']);
    expect(sourceToLesson(replaced).quiz[0].lessonBlockIds).toEqual(['superposition', 'both']);
    const removed = setQuestionReview(replaced, 0, []);
    expect(sourceToLesson(removed).quiz[0].lessonBlockIds).toBeUndefined();
    expect(removed).toBe(labelled);
  });

  it('makes readable, unique labels', () => {
    const taken = new Set(['core-principles']);
    expect(newLabel({ type: 'heading', text: 'Core Principles' }, taken)).toBe('core-principles-2');
    expect(newLabel({ type: 'paragraph', text: 'Qubits: unlike classical bits, they can' }, taken)).toBe('qubits-unlike-classical-bits');
    expect(newLabel({ type: 'paragraph', text: '$|\\psi\\rangle$' }, new Set())).toBe('psi-rangle');
  });
});

describe('AI round trip', () => {
  it('puts the format guide, title and document in the prompt', () => {
    const prompt = aiPrompt('Basic Principles', '# Hi\n');
    expect(prompt).toContain(':::quiz');
    expect(prompt).toContain('Lesson title: Basic Principles\n\n# Hi\n');
  });

  it('unwraps a fenced reply and reads its title line', () => {
    expect(readAiReply('```markdown\nLesson title: New title\n\n# Hi\n```')).toEqual({ title: 'New title', source: '# Hi\n' });
    expect(readAiReply('# Hi')).toEqual({ title: null, source: '# Hi\n' });
  });
});
