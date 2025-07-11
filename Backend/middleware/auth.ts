import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const auth = (req: any, res: Response, next: NextFunction) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = verified;
    next();
  } catch {
    res.status(400).json({ message: 'Invalid token' });
  }
};
export const authOptional = (req: any, res: Response, next: NextFunction) => {
  const token = req.header('Authorization');
  if (!token) return next();

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = verified;
  } catch {
    return res.status(400).json({ message: 'Invalid token' });
  }
  
  next();
};