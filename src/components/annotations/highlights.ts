/** `==like this==` in a letter or a song note becomes a highlighter mark. */

export interface TextPart {
  readonly text: string;
  readonly marked: boolean;
}

const MARK = /==([^\s=](?:[^\n]*?[^\s=])??)==/g;

/**
 * Splits text into plain and marked parts. Like Markdown, the marked text
 * cannot start or end with a space; unmatched `==` stay as text.
 */
export function splitHighlights(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(MARK)) {
    if (match.index > last)
      parts.push({ text: text.slice(last, match.index), marked: false });
    parts.push({ text: match[1], marked: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), marked: false });
  return parts;
}

/** The text without the markers (titles, previews, emails). */
export function stripHighlights(text: string): string {
  return text.replace(MARK, "$1");
}
