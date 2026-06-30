import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * 本地验证 JWT，不再调 account-center
 * JWT 中携带：userId, phone, newapiKey, modelName, balance, group
 */
export default async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      newapiKey: decoded.newapiKey,
      modelName: decoded.modelName || config.MODEL_NAME,
      balance: decoded.balance || 0,
      group: decoded.group || config.NEWAPI_TOKEN_GROUP,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
}
