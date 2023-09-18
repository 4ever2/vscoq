export type TextDifference = "added" | "removed";

export interface TextAnnotation {
  /** the relationship this text has to the text of another state */
  diff?: TextDifference,
  /** what to display instead of this text */
  substitution?: string,
  /** the underlying text, possibly with more annotations */
  text: string
}

export interface ScopedText {
  /** A scope identifier */
  scope: string,
  /** Extra stuff */
  attributes?: any,
  /** the underlying text, possibly with more annotations */
  text: AnnotatedText,
}

export type AnnotatedText = string | TextAnnotation | ScopedText | (string | TextAnnotation | ScopedText)[];

export function isScopedText(text: AnnotatedText): text is ScopedText {
  return text && text.hasOwnProperty('scope');
}

export function isTextAnnotation(text: AnnotatedText): text is TextAnnotation {
  return text && typeof (text as any).text === 'string' && !text.hasOwnProperty('scope')
}

export function textToString(text: AnnotatedText): string {
  if (typeof text === 'string') {
    return text;
  } else if (text instanceof Array) {
    return text.map(textToString).join('');
  } else if (isScopedText(text)) {
    return textToString(text.text);
  } else {// TextAnnotation
    return textToString(text.text);
  }
}

export function textToDisplayString(text: AnnotatedText): string {
  if (typeof text === 'string') {
    return text;
  } else if (text instanceof Array) {
    return text.map(textToDisplayString).join('');
  } else if (isScopedText(text)) {
    return textToDisplayString(text.text);
  } else if (text.substitution) {// TextAnnotation
    return textToDisplayString(text.substitution);
  } else {// TextAnnotation
    return text.substitution ? text.substitution : text.text;
  }
}
