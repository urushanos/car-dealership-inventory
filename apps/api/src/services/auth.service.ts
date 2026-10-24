import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

export class DuplicateEmailError extends Error {
  constructor(message: string = 'Email is already registered') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message: string = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResult {
  token: string;
  user: UserResponse;
}

export class AuthService {
  async register(input: RegisterInput): Promise<UserResponse> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new DuplicateEmailError('An account with this email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // Enforce role: 'user' so public registration cannot grant administrator privileges
    const user = await User.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new InvalidCredentialsError();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '30m' }
    );

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await User.findById(id);
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

export const authService = new AuthService();
