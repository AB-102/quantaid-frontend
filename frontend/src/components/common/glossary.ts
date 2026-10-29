// Glossary terms (a lesson's interactiveTerms) are underlined where they first appear, with their definition on
// hover or focus. Matching ignores case and allows a plural "s"/"es", so "qubit" also marks "Qubits".

import type { Element, ElementContent, Root } from 'hast';

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const termPattern = (terms: string[]): RegExp =>
  new RegExp(`\\b(${terms.map(escapeRegex).join('|')})(?:s|es)?\\b`, 'gi');

// Which of `terms` appear in `text`, in the casing they're defined with
export function termsIn(text: string, terms: string[]): string[] {
  if (terms.length === 0) return [];
  const byLowercase = new Map(terms.map(term => [term.toLowerCase(), term]));
  const found = new Set<string>();
  for (const match of text.matchAll(termPattern(terms))) {
    const term = byLowercase.get(match[1].toLowerCase());
    if (term) found.add(term);
  }
  return [...found];
}

// Text inside these is left alone: code, links, math, and terms that are already marked
const SKIPPED_TAGS = new Set(['code', 'pre', 'a', 'dfn']);

const isMath = (element: Element): boolean => {
  const className = element.properties.className;
  return Array.isArray(className) && className.some(name => typeof name === 'string' && name.startsWith('katex'));
};

// Rehype plugin: wraps the first occurrence of each term in <dfn data-term="term">, which LessonText renders
// as a glossary term
export function rehypeGlossary(terms: string[]) {
  return (tree: Root) => {
    if (terms.length === 0) return;
    const pattern = termPattern(terms);
    const byLowercase = new Map(terms.map(term => [term.toLowerCase(), term]));
    const marked = new Set<string>();

    const wrapTerms = (value: string): ElementContent[] => {
      const pieces: ElementContent[] = [];
      let last = 0;
      for (const match of value.matchAll(pattern)) {
        const term = byLowercase.get(match[1].toLowerCase());
        if (!term || marked.has(term)) continue;
        marked.add(term);
        if (match.index > last) pieces.push({ type: 'text', value: value.slice(last, match.index) });
        pieces.push({
          type: 'element',
          tagName: 'dfn',
          properties: { dataTerm: term },
          children: [{ type: 'text', value: match[0] }],
        });
        last = match.index + match[0].length;
      }
      if (last === 0) return [{ type: 'text', value }];
      if (last < value.length) pieces.push({ type: 'text', value: value.slice(last) });
      return pieces;
    };

    const walk = (children: ElementContent[]): ElementContent[] =>
      children.flatMap(child => {
        if (child.type === 'text') return wrapTerms(child.value);
        if (child.type === 'element' && !SKIPPED_TAGS.has(child.tagName) && !isMath(child)) {
          child.children = walk(child.children);
        }
        return [child];
      });

    for (const child of tree.children) {
      if (child.type === 'element') child.children = walk(child.children);
    }
  };
}
