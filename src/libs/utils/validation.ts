export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return "Confirm password is required";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;
  const phoneRegex = /^[+]?[\d\s-]{7,20}$/;
  if (!phoneRegex.test(phone)) return "Please enter a valid phone number";
  return null;
}
