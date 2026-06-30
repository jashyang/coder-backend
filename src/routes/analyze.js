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

      const message = err.message || '';
      let status = 500;
      let response = { error: '分析出错，请稍后重试' };

      // 区分不同类型的错误
      if (message.includes('insufficient_user_quota') || message.includes('用户额度不足')) {
        status = 403;
        response = {
          error: '你的账户余额不足，请向管理员充值后再试',
          insufficient_quota: true,
        };
      } else if (message.includes('model_price_error') || message.includes('价格尚未由管理员配置')) {
        status = 400;
        response = {
          error: '当前模型价格未配置，请联系管理员',
          model_config_error: true,
        };
      } else if (message.includes('LLM API 请求失败')) {
        // 透传 NewAPI 的其他错误
        status = 502;
        response = { error: message.replace('LLM API 请求失败: ', '') };
      }

      console.error('代码分析出错:', message);

      if (!res.headersSent) {
        res.status(status).json(response);
      }
    }
  })();
});

export default router;
