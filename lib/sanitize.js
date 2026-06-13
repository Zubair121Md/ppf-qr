export function sanitizeText(str, maxLen = 1000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

export function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, 5000)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
