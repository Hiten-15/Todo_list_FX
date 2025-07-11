import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    let user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const userId = user.id;
    console.log('🔍 User ID:', user);
    const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET || 'fallback-secret');
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const hashed = await bcrypt.hash(password, 10);
    
    const user = new User({ email, password: hashed });
    await user.save();
    
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
