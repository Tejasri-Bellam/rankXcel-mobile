import { genericGETService, genericPOSTService, genericPATCHService } from "./api";
import { LoginPayload, SignupPayload, ForgotPasswordPayload, ResetPasswordConfirmPayload, VerifyEmailPayload, ResendOtpPayload, UpdateProfilePayload, } from "../types/auth";

// ---------------- AUTH ----------------

// Login
export async function loginService(values: LoginPayload) {
  return await genericPOSTService("/v1/auth/login/", values, false, false);
}

// Signup / Register
export async function signupService(values: SignupPayload) {
  return await genericPOSTService("/v1/auth/register/", values, false, false);
}

// Logout
export async function logoutService() {
  return await genericPOSTService("/v1/auth/logout/", {}, false, true);
}

// Forgot Password
export async function forgotPasswordService(values: ForgotPasswordPayload) {
  return await genericPOSTService("/v1/auth/forgot-password/", values, false, false);
}

// Reset Password Confirm
export async function resetPasswordConfirmService(
  uidb64: string,
  token: string,
  values: ResetPasswordConfirmPayload
) {
  return await genericPOSTService(
    `/v1/auth/password/reset/confirm/${uidb64}/${token}/`,
    values,
    false,
    false
  );
}

// Verify Email
export async function verifyEmailService(values: VerifyEmailPayload) {
  return await genericPOSTService("/v1/auth/verify-email/", values, false, false);
}

// Resend OTP
export async function resendOtpService(values: ResendOtpPayload) {
  return await genericPOSTService("/v1/auth/resend-otp/", values, false, false);
}

// ---------------- USER ----------------

// Get Current User
export async function getMeService() {
  return await genericGETService("/v1/auth/me/", true);
}

// Update Current User
export async function updateMeService(values: UpdateProfilePayload) {
  return await genericPATCHService("/v1/auth/me/", values, false, true);
}

// ---------------- USERS ADMIN ----------------

// Get All Users
export async function getUsersService() {
  return await genericGETService("/v1/auth/users/", true);
}

// Create User
export async function createUserService(values: SignupPayload) {
  return await genericPOSTService("/v1/auth/users/", values, false, true);
}

// Get Single User
export async function getUserByIdService(id: number) {
  return await genericGETService(`/v1/auth/users/${id}/`, true);
}

// Update User
export async function updateUserService(id: number, values: UpdateProfilePayload) {
  return await genericPATCHService(`/v1/auth/users/${id}/`, values, false, true);
}

// Activate User
export async function activateUserService(id: number) {
  return await genericPOSTService(`/v1/auth/users/${id}/activate/`, {}, false, true);
}

// Suspend User
export async function suspendUserService(id: number) {
  return await genericPOSTService(`/v1/auth/users/${id}/suspend/`, {}, false, true);
}