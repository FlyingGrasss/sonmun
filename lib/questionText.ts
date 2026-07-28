const editorTokens: Record<string, string> = {
  "{minimumMotivationWords}": "[minimum motivation words]",
  "{minimumDelegates}": "[minimum delegates]",
  "{committeePreferenceCount}": "[number of committee preferences]",
  "{number}": "[question number]",
};

export function questionTextForEditor(value: string) {
  return Object.entries(editorTokens).reduce(
    (text, [token, explanation]) => text.replaceAll(token, explanation),
    value
  );
}

export function questionTextFromEditor(value: string) {
  return Object.entries(editorTokens).reduce(
    (text, [token, explanation]) => text.replaceAll(explanation, token),
    value
  );
}
