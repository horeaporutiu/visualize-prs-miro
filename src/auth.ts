import { Request, Response, NextFunction } from 'express';

// Middleware to validate API tokens on protected routes
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const publicPaths = ['/health', '/api/public'];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!isValidToken(token)) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  next();
}

function isValidToken(token: string): boolean {
  // In production, verify against your auth provider (OAuth, JWT, etc.)
  return token.length > 0;
}
