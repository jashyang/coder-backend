import { config } from '../config.js';

/**
 * 验证 token → 调 account-center /auth/verify → 注入 req.user
 * 用户信息: { user_id, phone, newapi_key, model_name, balance }
 */
export default async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  const token = header.split(' ')[1];

  try {
    const resp = await fetch(`${config.ACCOUNT_CENTER_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      return res.status(401).json({ error: '未登录或登录已过期' });
    }

    const userData = await resp.json();
    req.user = {
      userId: userData.user_id,
      phone: userData.phone,
      newapiKey: userData.newapi_key,
      modelName: userData.model_name || config.MODEL_NAME,
      balance: userData.balance || 0,
    };
    next();
  } catch (err) {
    console.error('[Auth] Verify error:', err.message);
    return res.status(502).json({ error: '认证服务不可用' });
  }
}
