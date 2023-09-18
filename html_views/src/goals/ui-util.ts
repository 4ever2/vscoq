export function makeBreakingText(text: string) : Text[] {
  var txt =
    document.createTextNode(text.replace(/[\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g, ' '))
  return [txt];
}

