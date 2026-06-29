import crypto from 'crypto';

// 内存存储：token → { answer, expiresAt }
const store = new Map();

const TTL_MS = 5 * 60 * 1000; // 5 min
const SVG_WIDTH = 180;
const SVG_HEIGHT = 50;

// 定期清理过期
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of store) {
    if (data.expiresAt < now) store.delete(token);
  }
}, 60_000);

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/**
 * 生成数学题验证码
 * @returns { svg, token }
 */
export function create() {
  const a = rand(10, 50);
  const b = rand(1, 50 - a); // 确保加法结果 ≤ 50
  const answer = a + b;
  const text = `${a} + ${b} = ?`;

  const token = crypto.randomUUID();
  store.set(token, { answer, expiresAt: Date.now() + TTL_MS });

  // 生成 SVG（带轻微视觉噪声）
  const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f39c12', '#9b59b6'];
  const color = colors[rand(0, colors.length - 1)];
  const fontSize = rand(22, 28);
  const x = rand(20, 35);
  const y = rand(32, 38);
  const rot = rand(-8, 8);

  const lines = [];
  // 背景噪线
  for (let i = 0; i < 3; i++) {
    const x1 = rand(0, SVG_WIDTH);
    const y1 = rand(0, SVG_HEIGHT);
    const x2 = rand(0, SVG_WIDTH);
    const y2 = rand(0, SVG_HEIGHT);
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ddd" stroke-width="1"/>`);
  }
  // 噪点
  for (let i = 0; i < 15; i++) {
    const cx = rand(0, SVG_WIDTH);
    const cy = rand(0, SVG_HEIGHT);
    lines.push(`<circle cx="${cx}" cy="${cy}" r="1.5" fill="#ccc"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <rect width="100%" height="100%" fill="#f8f9fa" rx="6"/>
  ${lines.join('\n  ')}
  <text x="${x}" y="${y}" font-size="${fontSize}" font-family="monospace" font-weight="bold"
        fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${text}</text>
</svg>`;

  return { svg, token };
}

/**
 * 验证 CAPTCHA
 * @param {string} token
 * @param {string|number} answer 用户输入的答案
 * @returns {boolean}
 */
export function verify(token, answer) {
  if (!token || answer === undefined || answer === null) return false;
  const data = store.get(token);
  if (!data) return false;
  store.delete(token); // 一次性，用完即废
  if (data.expiresAt < Date.now()) return false;
  return String(data.answer) === String(answer).trim();
}
