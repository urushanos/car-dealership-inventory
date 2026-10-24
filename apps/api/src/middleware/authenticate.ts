import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; role: "user" | "admin" };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
