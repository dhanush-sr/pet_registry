import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface VetPayload {
  id: string;
  username: string;
  name: string;
  clinic: string | null;
}

declare global {
  namespace Express {
    interface Request {
      vet?: VetPayload;
    }
  }
}

export function requireVet(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Vet authentication required" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration: missing SESSION_SECRET" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as VetPayload;
    req.vet = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
