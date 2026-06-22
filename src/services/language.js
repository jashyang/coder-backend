/**
 * 根据代码内容检测编程语言
 */

const LANGUAGE_RULES = [
  {
    name: 'Python',
    patterns: [
      /\bdef\b/,
      /\bimport\b/,
      /\bprint\s*\(/,
      /\bclass\s+\w+.*:/,
      /if\s+__name__/,
      /\belif\b/,
      /\bexcept\b/,
    ],
  },
  {
    name: 'TypeScript',
    patterns: [
      /\binterface\b/,
      /\btype\s+\w+/,
      /:\s*string\b/,
      /:\s*number\s*\|/,
      /:\s*boolean\b/,
      /\bas\s+const\b/,
    ],
  },
  {
    name: 'JavaScript',
    patterns: [
      /\bfunction\b/,
      /\bconst\b/,
      /\blet\b/,
      /\bvar\b/,
      /console\.log/,
      /=>/,
      /\brequire\s*\(/,
      /module\.exports/,
    ],
  },
  {
    name: 'Java',
    patterns: [
      /\bpublic\s+class\b/,
      /\bprivate\b/,
      /System\.out\.println/,
      /\bstatic\s+void\b/,
      /@Override/,
    ],
  },
  {
    name: 'C++',
    patterns: [
      /#include\s*<iostream/,
      /std::cout/,
      /class\s+\w+.*\{[\s\S]*\n/,
      /->/,
      /std::vector/,
    ],
  },
  {
    name: 'C',
    patterns: [
      /#include\s*<stdio/,
      /\bint\s+main\s*\(/,
      /\bprintf\s*\(/,
    ],
  },
  {
    name: 'Go',
    patterns: [
      /\bpackage\s+main\b/,
      /\bfunc\s+main\s*\(/,
      /\bfmt\./,
      /:=/,
    ],
  },
  {
    name: 'Rust',
    patterns: [
      /\bfn\s+main\s*\(/,
      /\blet\s+mut\b/,
      /println!/,
      /\bimpl\b/,
      /->\s*Result/,
    ],
  },
  {
    name: 'Ruby',
    patterns: [
      /\bdef\b/,
      /\bend\b/,
      /\bputs\b/,
      /require\s+'/,
    ],
  },
  {
    name: 'PHP',
    patterns: [
      /<\?php/,
      /echo\s+\$/,
      /\bfunction\b/,
      /\$\w+/,
    ],
  },
  {
    name: 'SQL',
    patterns: [
      /\bSELECT\b/i,
      /\bFROM\b/i,
      /\bWHERE\b/i,
      /\bINSERT\s+INTO\b/i,
      /\bUPDATE\b/i,
      /\bDELETE\s+FROM\b/i,
    ],
  },
];

const SHEBANG_RULES = [
  { pattern: /python/i, name: 'Python' },
  { pattern: /node/i, name: 'JavaScript' },
  { pattern: /bash|sh/i, name: 'Bash' },
  { pattern: /ruby/i, name: 'Ruby' },
  { pattern: /php/i, name: 'PHP' },
];

/**
 * 检测代码的编程语言
 * @param {string} code - 源代码
 * @returns {string} 检测到的语言名称，无法识别时返回 "unknown"
 */
export function detect(code) {
  if (!code || typeof code !== 'string') {
    return 'unknown';
  }

  const firstLine = code.split('\n')[0].trim();

  // shebang 优先
  if (firstLine.startsWith('#!')) {
    for (const { pattern, name } of SHEBANG_RULES) {
      if (pattern.test(firstLine)) {
        return name;
      }
    }
  }

  // 关键词匹配，统计各语言命中数
  const scores = {};

  for (const { name, patterns } of LANGUAGE_RULES) {
    let count = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        count++;
      }
    }
    if (count > 0) {
      scores[name] = count;
    }
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) {
    return 'unknown';
  }

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
