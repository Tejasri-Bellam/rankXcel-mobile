// Question-type helpers shared across the practice/test/mock/assessment flows.
// The backend question_type enum (QuestionTypeEnum) is one of:
//   MCQ_SINGLE | MCQ_MULTIPLE | NUMERICAL | ASSERTION_REASON
// The matchers normalise loosely so legacy/alternate strings still resolve.

// Multi-select MCQ — more than one option may be correct; render checkboxes.
export const isMultiSelectType = (type: string | undefined): boolean => {
  if (!type) return false;
  const t = type.toUpperCase();
  return (
    t === "MCQ_MULTIPLE" ||
    t === "MULTI_CORRECT" ||
    t === "MULTI CORRECT" ||
    t === "MULTIPLE" ||
    t.includes("MULTI")
  );
};

// Numerical — the student types a value instead of picking an option.
export const isNumericalType = (type: string | undefined): boolean =>
  !!type && type.toUpperCase().includes("NUMERIC");

// Assertion-Reason — a claim + reason pair above a single-select option list.
export const isAssertionReasonType = (type: string | undefined): boolean =>
  !!type && type.toUpperCase().includes("ASSERTION");

// Human-readable label for a question_type, shown on the question header.
export const questionTypeLabel = (type: string | undefined): string => {
  if (!type) return "Single Correct";
  const t = type.toUpperCase();
  if (isMultiSelectType(t)) return "Multiple Correct";
  if (isNumericalType(t)) return "Numerical";
  if (isAssertionReasonType(t)) return "Assertion & Reason";
  return "Single Correct";
};

// Order-independent equality for two id sets (used for MCQ_MULTIPLE scoring:
// a selection is correct only when it matches the correct set exactly).
export const idSetsEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sb = new Set(b.map(String));
  return a.every((id) => sb.has(String(id)));
};
