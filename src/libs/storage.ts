import AsyncStorage from "@react-native-async-storage/async-storage";

const StorageKeys = {
    USERNAME: 'username',
    ACCESSTOKEN: 'accessToken',
    SESSIONID: 'sessionId',
    // Device-scoped flag marking that the onboarding intro has been shown once.
    // Intentionally NOT user-scoped — it must survive logout so onboarding is
    // never re-shown to a returning user (see USER_SCOPED_KEYS below).
    ONBOARDING_SEEN: 'onboardingSeen',
} as const

export async function storageSetAccessToken(accessToken: string) {
    await AsyncStorage.setItem(StorageKeys.ACCESSTOKEN, accessToken);
}

export async function storageGetAccessToken() {
    const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESSTOKEN);
    return accessToken || '';
}

// The onboarding intro carousel should appear only on the first launch after
// install. These persist a one-time flag across launches (and across logout).
export async function storageSetOnboardingSeen() {
    await AsyncStorage.setItem(StorageKeys.ONBOARDING_SEEN, 'true');
}

export async function storageGetOnboardingSeen() {
    const seen = await AsyncStorage.getItem(StorageKeys.ONBOARDING_SEEN);
    return seen === 'true';
}

// Keys that hold data scoped to the logged-in user. These must be wiped on
// logout (and again on login, as a safety net) so a different student never
// sees the previous student's cached data — see clearUserSession().
const USER_SCOPED_KEYS: string[] = [
    StorageKeys.ACCESSTOKEN,
    StorageKeys.USERNAME,
    StorageKeys.SESSIONID,
    'user',
    'region',
    // TargetExamContext selection/catalogue.
    'activeExamId',
    'targetExams',
    'regionCountryId',
];

// Prefixes for per-resource caches that are also user-specific
// (dashboardData_<examId>, quiz_attempt_<quizId>, quiz_answers_<attemptId>).
const USER_SCOPED_PREFIXES = ['dashboardData_', 'quiz_attempt_', 'quiz_answers_'];

// Clears everything tied to the current user so no stale data leaks across
// accounts. App-wide config (e.g. cached platform settings) is intentionally
// left untouched.
export async function clearUserSession() {
    const allKeys = await AsyncStorage.getAllKeys();
    const dynamic = allKeys.filter((k) =>
        USER_SCOPED_PREFIXES.some((p) => k.startsWith(p))
    );
    const toRemove = Array.from(new Set([...USER_SCOPED_KEYS, ...dynamic]));
    await AsyncStorage.multiRemove(toRemove);
}