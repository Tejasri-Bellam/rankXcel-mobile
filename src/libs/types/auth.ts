export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordConfirmPayload {
  new_password: string;
  re_new_password: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}