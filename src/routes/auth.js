import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { create as createCaptcha, verify as verifyCaptcha } from '../services/captcha.js';

const router = Router();

async function callAccountCenter(path, body) {
  const resp = await fetch(`${config.ACCOUNT_CENTER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-API-Key': config.ACCOUNT_API_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

router.get('/captcha', (_req, res) => {
  const { svg, token } = createCaptcha();
  res.json({ svg, token });
});

router.post('/send-code', async (req, res) => {
  const { phone, captcha_token, captcha_answer } = req.body;
  if (!phone) return res.status(400).json({ error: '手机号不能为空' });

  if (!verifyCaptcha(captcha_token, captcha_answer)) {
    return res.status(400).json({ error: '验证码错误，请重新输入' });
  }

  const { ok, status, data } = await callAccountCenter('/auth/send-code', {
    phone,
    _real_ip: req.headers['x-real-ip'] || req.ip,
  });
  res.status(status).json(data);
});

router.post('/register', async (req, res) => {
  const { phone, code, password, group, default_model } = req.body;
  if (!phone || !code || !password) {
    return res.status(400).json({ error: '手机号、验证码、密码不能为空' });
  }

  const { ok, status, data } = await callAccountCenter('/auth/register', {
    phone, code, password,
    group: group || config.NEWAPI_GROUP,
    default_model: default_model || config.MODEL_NAME,
  });

  if (!ok) return res.status(status).json(data);

  const token = jwt.sign(
    {
      userId: data.user_id,
      phone: data.phone,
      newapiKey: data.newapi_key || '', modelName: config.MODEL_NAME,
      balance: 0,
      group: config.NEWAPI_GROUP,
    },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: data });
});

router.post('/login', async (req, res) => {
  const { username, password, phone, code } = req.body;
  const loginPhone = phone || username;
  if (!loginPhone) return res.status(400).json({ error: '手机号不能为空' });

  const loginBody = code ? { phone: loginPhone, code, group: config.NEWAPI_GROUP, default_model: config.MODEL_NAME } : { phone: loginPhone, password };
  const { ok, status, data } = await callAccountCenter('/auth/login', loginBody);

  if (!ok) return res.status(status).json(data);

  const verifyResp = await fetch(`${config.ACCOUNT_CENTER_URL}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-API-Key': config.ACCOUNT_API_KEY,
      'Authorization': `Bearer ${data.token}`,
    },
  });

  if (!verifyResp.ok) {
    return res.status(502).json({ error: '认证服务不可用' });
  }

  const userData = await verifyResp.json();

  const token = jwt.sign(
    {
      userId: userData.user_id,
      phone: userData.phone,
      newapiKey: userData.newapi_key || '', modelName: userData.model_name || config.MODEL_NAME,
      balance: userData.balance || 0,
      group: userData.group || config.NEWAPI_GROUP,
    },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: userData });
});

export default router;
