import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import analyzeRouter from './routes/analyze.js';

const app = express();

// CORS 配置
app.use(
  cors({
    origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(','),
  })
);

// JSON 请求体解析
app.use(express.json({ limit: '50kb' }));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 代码分析路由
app.use('/api/analyze', analyzeRouter);

app.listen(config.PORT, () => {
  console.log(`coder-backend 服务已启动，监听端口 ${config.PORT}`);
});
