import { marked, type Token, type Tokens } from 'marked';
import { createHash } from 'node:crypto';
import type { Block, Inline } from '../../shared/types.js';
const inline = (tokens: Token[]): Inline[] => tokens.flatMap((t): Inline[] => {
  if (t.type === 'br') return [{ kind: 'break' }];
  if (t.type === 'image') throw new Error('Place each asset image on its own line, separated from prose by a blank line.');
  if (t.type === 'html') throw new Error('Use Markdown, not HTML, in publications.');
  if (['em', 'strong', 'del', 'link'].includes(t.type)) {
    const x = t as Tokens.Em;
    return [{ kind: t.type === 'em' ? 'em' : t.type === 'strong' ? 'strong' : 'text', children: inline(x.tokens) }];
  }
  return [{ kind: t.type === 'codespan' ? 'code' : 'text', text: 'text' in t ? String(t.text) : t.raw }];
});
export function plain(nodes: Inline[]): string { return nodes.map(n => n.children ? plain(n.children) : n.kind === 'break' ? '\n' : n.text ?? '').join(''); }
export function compose(markdown: string, publicationId: string): Block[] {
  const blocks: Block[] = [];
  const add = (b: Omit<Block,'id'>) => blocks.push({ ...b, id: 'b-' + createHash('sha256').update(`${publicationId}:${blocks.length}:${JSON.stringify(b)}`).digest('hex').slice(0,20) });
  for (const token of marked.lexer(markdown)) {
    if (token.type === 'space' || token.type === 'def') continue;
    if (token.type === 'hr') { add({ kind: 'break', text: '' }); continue; }
    if (token.type === 'code') { add({kind:'code',text:token.text}); continue; }
    if (token.type === 'list') { const items = (token as Tokens.List).items.map(i => inline(marked.Lexer.lexInline(i.text))); add({kind:'list',text:items.map(plain).join('\n'),items,ordered:token.ordered}); continue; }
    if (token.type === 'blockquote') { const nodes = inline(marked.Lexer.lexInline(token.text)); add({kind:'quote',inline:nodes,text:plain(nodes)}); continue; }
    if (token.type === 'heading' || token.type === 'paragraph') {
      const t = token as Tokens.Heading | Tokens.Paragraph;
      if (t.tokens.length === 1 && t.tokens[0].type === 'image') {
        const image = t.tokens[0] as Tokens.Image;
        if (!/^asset:[a-zA-Z0-9_-]+$/.test(image.href)) throw new Error('Images must use a saved asset:ID reference.');
        add({kind:'figure',text:image.text,assetId:image.href.slice(6),caption:image.title ?? undefined});
      } else { const nodes = inline(t.tokens); add({ kind: t.type === 'heading' ? 'heading' : 'paragraph', inline:nodes,text:plain(nodes),...('depth' in t ? {level:t.depth} : {}) }); }
      continue;
    }
    throw new Error(`Unsupported Markdown structure: ${token.type}. Use prose, headings, quotes, lists, figures or breaks.`);
  }
  if (!blocks.length) throw new Error('The saved draft is empty.');
  return blocks;
}
