// Comparison helpers for NUMERICAL questions.
//
// The student types free text ("2.00", " 2 "), the answer key stores a string
// ("2"), and the API sends the saved response back as a float (2.0). Comparing
// those as strings marks a correct answer wrong, so every numeric check goes
// through numericAnswersEqual.

// Strip parentheses/commas/whitespace so "(1 200)" and "1200" compare equal.
export const normalizeNumericAnswer = (v: string): string => v.replace(/[(),\s]/g, '');

type NumericInput = string | number | null | undefined;

export const numericAnswersEqual = (a: NumericInput, b: NumericInput): boolean => {
  if (a == null || b == null) return false;
  const sa = normalizeNumericAnswer(String(a));
  const sb = normalizeNumericAnswer(String(b));
  if (sa === '' || sb === '') return false;

  const na = Number(sa);
  const nb = Number(sb);
  // Compare by value when both sides parse; fall back to text for anything
  // that isn't a plain number (units, ranges, symbolic answers).
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-6;
  return sa === sb;
};
