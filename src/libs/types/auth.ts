export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
  otp?: string;
  new_password?: string;
  type?: 'send_otp' | 'verify_otp' | 'resend_otp' | 'reset_password';
}

export interface ResetPasswordConfirmPayload {
  password: string;
  confirm_password: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
  // The backend requires the OTP purpose; for signup verification it's "registration".
  purpose?: string;
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