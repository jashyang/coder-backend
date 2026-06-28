import { config } from '../config.js';
import JSON5 from 'json5';

/**
 * 构造系统提示词
 */
function buildSystemPrompt(language, optimize) {
  return `你是一个专业的编程导师，擅长分析代码错误和提供优化建议。
对用户提交的 ${language} 代码，请：
1. 找出所有语法错误和逻辑错误
2. 对每个错误指出行号、错误信息、错误原因（用中文）、修改方案（用中文）、修正后的代码片段
3. ${optimize ? '给出' : '不需要给出'}代码优化建议（可读性、性能、最佳实践）

用户代码每行开头已标注行号（如 "1 | code"），请根据行号返回准确的 line 值。

严格按以下 JSON 格式返回，不要 Markdown 包裹：
{ "errors": [{ "line": 1, "message": "错误信息", "reason": "错误原因", "fix": "修改方案", "fixed_code": "修正后代码" }], "optimization": { "suggestions": ["建议1", "建议2"], "fixed_code": "优化后代码" }, "no_errors": false }

如果代码没有错误，返回 { "no_errors": true, "optimization": { "suggestions": ["代码正确，继续加油！"] } }`;
}

/**
 * 将 JS 对象字面量修复为标准 JSON
 * {key: value} → {"key": "value"}（保留 true/false/null/数字）
 */
function jsObjectToJson(text) {
  let result = text.trim();
  // 确保外层有 {}
  if (!result.startsWith('{')) return text;

  // 1. 给未加引号的键名加引号: {key: → {"key":   ,key: → ,"key":
  result = result.replace(/([,{])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // 2. 给未加引号的字符串值加引号: :value → :"value"
  // 匹配 : 后面跟着一个非引号、非 {、非 [、非数字、非 true/false/null 的 token
  // 使用字符逐个扫描的方式处理，但先用简单方式
  result = result.replace(/:\s*([a-zA-Z_\u4e00-\u9fff][a-zA-Z0-9_\u4e00-\u9fff]*)\s*([,}\]])/g, ':"$1"$2');
  result = result.replace(/:\s*([a-zA-Z_\u4e00-\u9fff][a-zA-Z0-9_\u4e00-\u9fff]*)\s*$/g, ':"$1"');

  return result;
}

/**
 * 从文本中提取 JSON（支持非标准格式）
 */
function extractJson(text) {
  // 1. 直接 JSON.parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // 2. 提取 ```json ... ``` 或 ``` ... ``` 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const block = codeBlockMatch[1].trim();
    try { return JSON5.parse(block); } catch { /* continue */ }
    try { return JSON.parse(jsObjectToJson(block)); } catch { /* continue */ }
  }

  // 3. 提取最外层 {} 对象
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const obj = jsonMatch[0];
    try { return JSON5.parse(obj); } catch { /* continue */ }
    try { return JSON.parse(jsObjectToJson(obj)); } catch { /* continue */ }
  }

  return null;
}

/**
 * 给代码每行加上行号前缀
 */
function addLineNumbers(code) {
  return code
    .split('\n')
    .map((line, i) => `${i + 1} | ${line}`)
    .join('\n');
}

/**
 * 调用 LLM 分析代码
 */
export async function analyze(code, language, optimize = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.MODEL_API_KEY) {
    headers['Authorization'] = `Bearer ${config.MODEL_API_KEY}`;
  }

  const numberedCode = addLineNumbers(code);

  const response = await fetch(config.MODEL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.MODEL_NAME,
      messages: [
        { role: 'system', content: buildSystemPrompt(language, optimize) },
        { role: 'user', content: numberedCode },
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
