import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// GET /api/auth/status — 检查系统是否已初始化（是否有用户）
router.get('/status', async (_req, res) => {
  try {
    const result = await query('SELECT COUNT(*)::int AS count FROM users');
    const initialized = result.rows[0].count > 0;
    res.json({ initialized });
  } catch (err) {
    console.error('检查初始化状态失败:', err);
    res.status(500).json({ error: '检查初始化状态失败' });
  }
});

// POST /api/auth/init — 系统初始化，创建管理员账户（仅当无用户时有效）
router.post('/init', async (req, res) => {
  try {
    const { username, password } = req.body;

    const countResult = await query('SELECT COUNT(*)::int AS count FROM users');
    if (countResult.rows[0].count > 0) {
      return res.status(400).json({ error: '系统已初始化，不能重复创建管理员' });
    }

    if (!username || !password || username.length < 2 || password.length < 4) {
      return res.status(400).json({ error: '用户名至少2个字符，密码至少4个字符' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, password_hash]);

    res.json({ message: '初始化成功，请登录' });
  } catch (err) {
    console.error('初始化失败:', err);
    res.status(500).json({ error: '初始化失败，请稍后重试' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    const result = await query(
      'SELECT id, username, password_hash, disabled FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = result.rows[0];

    if (user.disabled) {
      return res.status(403).json({ error: '该账户已被禁用' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// ── 用户管理（需登录） ──────────────────────────────────

// GET /api/auth/users — 获取用户列表
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, disabled, created_at FROM users ORDER BY created_at ASC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// DELETE /api/auth/users/:id — 删除用户
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账户' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ message: '用户已删除' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// PATCH /api/auth/users/:id/disable — 切换禁用状态
router.patch('/users/:id/disable', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: '不能禁用/启用自己的账户' });
    }

    const result = await query(
      'UPDATE users SET disabled = NOT disabled WHERE id = $1 RETURNING id, username, disabled',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    res.json({ message: user.disabled ? '用户已禁用' : '用户已启用', disabled: user.disabled });
  } catch (err) {
    console.error('切换用户状态失败:', err);
    res.status(500).json({ error: '切换用户状态失败' });
  }
});

export default router;
