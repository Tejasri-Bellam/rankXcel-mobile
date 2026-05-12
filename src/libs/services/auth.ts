// import { genericGETService, genericPOSTService, genericPATCHService, genericDELETEService } from "./api";
import { LoginPayload, SignupPayload, ForgotPasswordPayload, ResetPasswordConfirmPayload, VerifyEmailPayload, ResendOtpPayload, UpdateProfilePayload, } from "../types/auth";
import { genericPost } from "./genericService";

// ---------------- AUTH ----------------

// Login
// export async function loginService(values: LoginPayload) {
//   console.log("Login Service Called with values:", values);
//   return await genericPOSTService("/v1/auth/login/", values, false, false);
// }
// Login
export async function loginService(data: any) {
  return await genericPost(
    "/v1/auth/login/",
    data,
    { useAccessToken: false }
  );
}

// Signup / Register
export async function signupService(
  values: SignupPayload
) {
  return await genericPost(
    "/v1/auth/register/",
    values,
    { useAccessToken: false }
  );
}

// Logout
export async function logoutService() {
  return await genericPost(
    "/v1/auth/logout/",
    {},
    { useAccessToken: true }
  );
}

// Forgot Password
export async function forgotPasswordService(
  values: ForgotPasswordPayload
) {
  return await genericPost(
    "/v1/auth/forgot-password/",
    values,
    { useAccessToken: false }
  );
}

// Reset Password Confirm
export async function resetPasswordConfirmService(
  uidb64: string,
  token: string,
  values: ResetPasswordConfirmPayload
) {
  return await genericPost(
    `/v1/auth/password/reset/confirm/${uidb64}/${token}/`,
    values,
    { useAccessToken: false }
  );
}

// Verify Email
export async function verifyEmailService(
  values: VerifyEmailPayload
) {
  return await genericPost(
    "/v1/auth/verify-email/",
    values,
    { useAccessToken: false }
  );
}

// Resend OTP
export async function resendOtpService(
  values: ResendOtpPayload
) {
  return await genericPost(
    "/v1/auth/resend-otp/",
    values,
    { useAccessToken: false }
  );
}