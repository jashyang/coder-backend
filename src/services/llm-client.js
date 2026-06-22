import { config } from '../config.js';

/**
 * 构造系统提示词
 * @param {string} language - 编程语言
 */
function buildSystemPrompt(language, optimize) {
  return `你是一个专业的编程导师，擅长分析代码错误和提供优化建议。
对用户提交的 ${language} 代码，请：
1. 找出所有语法错误和逻辑错误
2. 对每个错误指出行号、错误信息、错误原因（用中文）、修改方案（用中文）、修正后的代码片段
3. ${optimize ? '给出' : '不需要给出'}代码优化建议（可读性、性能、最佳实践）

严格按以下 JSON 格式返回，不要 Markdown 包裹：
{ "errors": [{ "line": 1, "message": "错误信息", "cause": "错误原因", "fix": "修改方案", "fixed_code": "修正后代码" }], "optimization": { "suggestions": ["建议1", "建议2"], "fixed_code": "优化后代码" }, "no_errors": false }

如果代码没有错误，返回 { "no_errors": true, "optimization": { "suggestions": ["代码正确，继续加油！"] } }`;
}

/**
 * 从文本中提取 JSON（支持 Markdown 代码块）
 * @param {string} text - 原始文本
 * @returns {object|null}
 */
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // 尝试从 Markdown 代码块中提取
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        return null;
      }
    }

    // 尝试匹配第一个 JSON 对象
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}

/**
 * 调用 LLM 分析代码
 * @param {string} code - 源代码
 * @param {string} language - 编程语言
 * @param {boolean} optimize - 是否请求优化建议
 * @returns {Promise<object>}
 */
export async function analyze(code, language, optimize = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.MODEL_API_KEY) {
    headers['Authorization'] = `Bearer ${config.MODEL_API_KEY}`;
  }

  const response = await fetch(config.MODEL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.MODEL_NAME,
      messages: [
        { role: 'system', content: buildSystemPrompt(language, optimize) },
        { role: 'user', content: code },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API 请求失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('LLM 返回内容为空');
  }

  const parsed = extractJson(content);
  if (!parsed) {
    throw new Error('无法解析 LLM 返回的 JSON');
  }

  return parsed;
}
