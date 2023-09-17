import { AnnotatedText, ScopedText, TextAnnotation } from '@lib/protocol';
export { AnnotatedText, ScopedText, TextAnnotation } from '@lib/protocol';


export function isScopedText(text: AnnotatedText): text is ScopedText {
  return text.hasOwnProperty('scope');
}

export function isTextAnnotation(text: AnnotatedText): text is TextAnnotation {
  return typeof (text as any).text === 'string'
}

export function textToString(text: AnnotatedText) : string {
  if(typeof text === 'string') {
    return text;
  } else if(text instanceof Array) {
    return text.map(textToString).join('');
  } else if(isScopedText(text)) {
    return textToString(text.text);
  } else {// TextAnnotation
    return textToString(text.text);
  }
}

export function textToDisplayString(text: AnnotatedText) : string {
  if(typeof text === 'string') {
    return text;
  } else if(text instanceof Array) {
    return text.map(textToDisplayString).join('');
  } else if(isScopedText(text)) {
    return textToDisplayString(text.text);
  } else if(text.substitution) {// TextAnnotation
    return textToDisplayString(text.substitution);
  } else{// TextAnnotation
    return text.substitution ? text.substitution : text.text;
  }
}
