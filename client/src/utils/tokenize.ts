/**
 * 将口诀文本切分为高亮 token 序列。
 * - 中文字符（CJK Unified Ideographs U+4E00-U+9FFF）每字一个 token
 * - ASCII 字母/数字按空白分组
 * - 标点和空白被跳过
 * 若提供 override，直接返回 override（不做切分）。
 */
export function tokenize(text: string, override?: string[]): string[] {
  if (override) return override;
  const tokens: string[] = [];
  let buf = '';
  const flush = () => { if (buf) { tokens.push(buf); buf = ''; } };
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    const isCJK = code >= 0x4e00 && code <= 0x9fff;
    const isAlnum = /[A-Za-z0-9]/.test(ch);
    if (isCJK) {
      flush();
      tokens.push(ch);
    } else if (isAlnum) {
      buf += ch;
    } else {
      flush();
    }
  }
  flush();
  return tokens;
}
