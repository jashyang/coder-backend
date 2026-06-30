import { Router } from 'express';
import { config } from '../config.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Helper: call account-center with user context
async function callAccount(path, method = 'GET', body = null) {
  const url = `${config.ACCOUNT_CENTER_URL}${path}`;
  const opts = {
    method,
    headers: {
      'X-Service-API-Key': config.ACCOUNT_API_KEY,
    },
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const resp = await fetch(url, opts);
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

// Helper: call payment center
async function callPayment(path, method = 'POST', body = null) {
  const url = `${config.PAYMENT_CENTER_URL}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Service-API-Key': config.ACCOUNT_API_KEY,
    },
    body: body ? JSON.stringify(body) : null,
  };
  const resp = await fetch(url, opts);
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

// All routes require auth
router.use(authMiddleware);

// GET /api/user/balance
router.get('/balance', async (req, res) => {
  const { ok, status, data } = await callAccount(`/balance?user_id=${req.user.userId}`);
  res.status(status).json(data);
});

// GET /api/user/consumption?days=7
router.get('/consumption', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const { ok, status, data } = await callAccount(`/user/consumption?user_id=${req.user.userId}&days=${days}`);
  res.status(status).json(data);
});

// GET /api/user/has-password
router.get('/has-password', async (req, res) => {
  const { ok, status, data } = await callAccount(`/user/has-password?user_id=${req.user.userId}`);
  res.status(status).json(data);
});

// POST /api/user/change-password
router.post('/change-password', async (req, res) => {
  const { new_password, old_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: '密码不能少于6位' });
  }
  const { ok, status, data } = await callAccount('/user/change-password', 'POST', {
    user_id: req.user.userId,
    new_password,
    old_password,
  });
  res.status(status).json(data);
});

// POST /api/user/topup — proxy to payment service
router.post('/topup', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '金额必须大于0' });
  }
  const { ok, status, data } = await callPayment('/order/create', 'POST', {
    user_id: req.user.userId,
    amount,
  });
  res.status(status).json(data);
});

export default router;
