import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import analyzeRouter from './routes/analyze.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import authMiddleware from './middleware/auth.js';

const app = express();

// CORS 配置
app.use(
  cors({
    origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(','),
  })
);

// JSON 请求体解析
app.use(express.json({ limit: '50kb' }));

// 健康检查（无需认证）
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 认证路由（send-code / register / login，无需本地 JWT）
app.use('/api/auth', authRouter);

// 代码分析路由（需要认证）
app.use('/api/analyze', authMiddleware, analyzeRouter);

// 个人中心路由（需要认证）
app.use('/api/user', userRouter);

// 启动
(async () => {
  try {
    app.listen(config.PORT, () => {
      console.log(`coder-backend 服务已启动，监听端口 ${config.PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
})();
