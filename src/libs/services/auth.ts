import { SignupPayload, ForgotPasswordPayload, ResetPasswordConfirmPayload, VerifyEmailPayload, ResendOtpPayload, UpdateProfilePayload, } from "../types/auth";
import { genericPost } from "./genericService";


export async function loginService(data: any) {
  return await genericPost(
    "/v1/auth/login/",
    data,
    { useAccessToken: false }
  );
}

export async function googleLoginService(data: any) {
  return await genericPost(
    "/v1/auth/google_sso/",
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
  try {
    const response = await genericPost( "/v1/auth/logout/",{},
      { useAccessToken: true, }
    );
    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    throw error;
  }
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