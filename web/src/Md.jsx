import React from "react";
function inline(t, k) {
  const out = []; const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g; let last = 0, m, i = 0;
  while ((m = re.exec(t))) { if (m.index > last) out.push(t.slice(last, m.index)); const s = m[0]; out.push(s.startsWith("**") ? <b key={k + "b" + i++}>{s.slice(2, -2)}</b> : s.startsWith("`") ? <code key={k + "c" + i++}>{s.slice(1, -1)}</code> : <i key={k + "i" + i++}>{s.slice(1, -1)}</i>); last = m.index + s.length; }
  if (last < t.length) out.push(t.slice(last)); return out;
}
export default function Md({ text }) {
  const lines = String(text || "").split("\n"), out = []; let i = 0, key = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^\s*\|/.test(l) && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] || "")) {
      const cells = (s) => s.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()); const head = cells(l); i += 2; const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      out.push(<div className="md-t" key={key++}><table><thead><tr>{head.map((h, j) => <th key={j}>{inline(h, "h" + j)}</th>)}</tr></thead><tbody>{rows.map((r, a) => <tr key={a}>{r.map((c, j) => <td key={j}>{inline(c, "c" + a + j)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/); if (h) { out.push(<h4 className="md-h" key={key++}>{inline(h[2], "h" + key)}</h4>); i++; continue; }
    if (/^\s*([-*•])\s+/.test(l)) { const items = []; while (i < lines.length && /^\s*([-*•])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*•])\s+/, "")); i++; } out.push(<ul key={key++}>{items.map((s, j) => <li key={j}>{inline(s, "u" + j)}</li>)}</ul>); continue; }
    if (/^\s*\d+[.)]\s+/.test(l)) { const items = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "")); i++; } out.push(<ol key={key++}>{items.map((s, j) => <li key={j}>{inline(s, "o" + j)}</li>)}</ol>); continue; }
    const para = []; while (i < lines.length && lines[i].trim() && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^\s*\|/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(<p key={key++}>{inline(para.join(" "), "p" + key)}</p>);
  }
  return <div className="md">{out}</div>;
}
