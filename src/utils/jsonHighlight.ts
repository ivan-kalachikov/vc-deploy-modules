const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function highlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")[ \t]*(:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g,
    (match, str?: string, colon?: string, bool?: string, num?: string, punct?: string) => {
      if (str) {
        const escaped = esc(str)
        return colon
          ? `<span class="json-key">${escaped}</span><span class="json-punct">:</span>`
          : `<span class="json-string">${escaped}</span>`
      }
      if (bool) return `<span class="json-bool">${esc(bool)}</span>`
      if (num) return `<span class="json-number">${esc(num)}</span>`
      if (punct) return `<span class="json-punct">${esc(punct)}</span>`
      return esc(match)
    },
  )
}
