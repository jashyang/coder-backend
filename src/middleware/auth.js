import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
}
