export interface User {
  id: string;
  role: 'PARENT' | 'CHILD';
  
  // Parent-specific fields
  email?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  
  // Child-specific fields
  username?: string;
  name?: string;
  parentId?: string;
  age?: number;
  grade?: string;
  
  // Common fields
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChildLoginCredentials {
  username: string;
  pin: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}

export interface EmailVerification {
  token: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}