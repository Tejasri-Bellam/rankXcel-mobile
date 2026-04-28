// src/json/signup.ts

export function SignupJson() {
  return {
    app: {
      logo: 'RankXcel',
    },

    headings: {
      title: 'Create your account',
      subtitle: 'Start your exam preparation with precision diagnostics.',
    },

    placeholders: {
      fullName: 'Arjun Mehta',
      email: 'you@example.com',
      mobile: '9876543210',
      password: 'Min. 8 characters',
      confirmPassword: 'Re-enter your password',
    },

    labels: {
      fullName: 'Full name',
      email: 'Email address',
      mobile: 'Mobile number',
      password: 'Password',
      confirmPassword: 'Confirm password',
      terms: 'I agree to the Terms of Service and Privacy Policy',
      loginText: 'Already have an account? ',
      loginLink: 'Log in',
      createBtn: 'Create Account',
      back: '← Back',
    },

    hints: {
      mobile: '10 digit mobile number',
    },

    alerts: {
      fillAll: 'Please fill in all fields',
      pwdMismatch: 'Passwords do not match',
      pwdMin: 'Password must be at least 8 characters',
      agreeTerms: 'Please agree to the Terms of Service and Privacy Policy',
      success: 'Account created successfully!',
    },
  };
}