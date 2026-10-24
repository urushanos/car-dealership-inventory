import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import {
  authService,
  DuplicateEmailError,
  InvalidCredentialsError,
} from '../services/auth.service.js';
import type { AuthRequest } from '../middleware/authenticate.js';

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.issues,
    });
  }

  try {
    const user = await authService.register(parsed.data);
    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error: any) {
    if (error instanceof DuplicateEmailError || error?.code === 11000) {
      return res.status(409).json({
        message: 'Email is already registered',
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.issues,
    });
  }

  try {
    const authResult = await authService.login(parsed.data);
    return res.status(200).json({
      message: 'Login successful',
      token: authResult.token,
      user: authResult.user,
    });
  } catch (error: any) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await authService.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ user });
}
