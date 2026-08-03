import { genericGet } from "./genericService";

// CMS content behind the marketing/landing page. These are read before login,
// so they're requested without an access token.

export interface CmsCountry {
  id: number;
  name: string;
  iso_code_2?: string;
  iso_code_3?: string;
  flag?: string;
  currency?: string;
}

// The `featured_exam` stub on a home page (and each row of the exams list).
export interface CmsExamRef {
  id: number;
  name: string;
  code: string;
}

export interface CmsHomePage {
  id: number;
  country: CmsCountry | null;
  title: string;
  description: string;
  featured_exam: CmsExamRef | null;
  // Live platform totals for this country — drive the hero stats row.
  users_count?: number | null;
  questions_count?: number | null;
}

export interface CmsExamSubject {
  id: number;
  name: string;
  code: string;
  order?: number;
  questions_count?: number;
  total_marks?: number;
  display_subject?: boolean;
  topics?: { id: number; name: string; code: string; subtopics?: any[] }[];
}

export interface CmsFeaturedExam extends CmsExamRef {
  description?: string;
  country?: CmsCountry | null;
  total_duration_minutes?: number | null;
  total_marks?: number | null;
  scoring_type?: string;
  subjects?: CmsExamSubject[];
}

// GET /v1/cms/home-pages/ — one entry per country; the caller picks the one
// matching the visitor's detected country.
export async function getCmsHomePagesService() {
  return await genericGet<CmsHomePage[]>("/v1/cms/home-pages/", false);
}

// GET /v1/cms/featured-exams/ — the exam list behind "Popular courses".
export async function getCmsFeaturedExamsService() {
  return await genericGet<CmsExamRef[]>("/v1/cms/featured-exams/", false);
}

// GET /v1/cms/featured-exams/{id}/ — full exam with subjects/topics.
export async function getCmsFeaturedExamService(id: number | string) {
  return await genericGet<CmsFeaturedExam>(`/v1/cms/featured-exams/${id}/`, false);
}

// Both endpoints have been seen returning a bare array and a paginated object.
export function cmsListFrom<T>(payload: any): T[] {
  return Array.isArray(payload)
    ? payload
    : (payload?.results ?? payload?.data ?? []);
}

// The home page for the visitor's country, falling back to the first entry so
// an unrecognised country still gets copy rather than a blank hero.
export function pickHomePageForCountry(
  pages: CmsHomePage[],
  countryId?: number | string | null,
): CmsHomePage | null {
  if (pages.length === 0) return null;
  if (countryId != null) {
    const match = pages.find((p) => String(p?.country?.id) === String(countryId));
    if (match) return match;
  }
  return pages[0];
}
