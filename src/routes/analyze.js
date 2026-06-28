import { Router } from 'express';
import * as languageService from '../services/language.js';
import * as llmClient from '../services/llm-client.js';

const router = Router();

const TIMEOUT_MS = 60_000;

/**
 * POST /api/analyze
 * 分析代码错误并提供优化建议
 * authMiddleware 已注入 req.user = { userId, phone, newapiKey, modelName, balance }
 */
router.post('/', (req, res) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: '分析超时，请稍后重试' });
    }
  }, TIMEOUT_MS);

  (async () => {
    try {
      const { code, language, optimize = false } = req.body;

      if (!code || typeof code !== 'string') {
        clearTimeout(timer);
        return res.status(400).json({ error: '请提供有效的 code 字段' });
      }

      const detectedLanguage = language || languageService.detect(code);
      // 用用户的 NewAPI key 调用 LLM
      const result = await llmClient.analyze(code, detectedLanguage, optimize, req.user?.newapiKey || '');

      clearTimeout(timer);

      if (!res.headersSent) {
        res.json({
          language: detectedLanguage,
          errors: result.errors || [],
          optimization: result.optimization || { suggestions: [], fixed_code: '' },
          no_errors: result.no_errors ?? false,
          balance: req.user?.balance || 0,
        });
      }
    } catch (err) {
      clearTimeout(timer);
      console.error('代码分析出错:', err);

      if (!res.headersSent) {
        res.status(500).json({ error: '分析出错，请稍后重试' });
      }
    }
  })();
});

export default router;
