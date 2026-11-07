/* Runs inside the page (Playwright serializes this function): everything it needs is defined inside it. */
export interface Findings {
  overflow: string[];
  small: string[];
  inline: string[];
  nested: string[];
  markdown: string[];
  native: string[];
  wrapped: string[];
}

export function measure(): Findings {
  const out: Findings = { overflow: [], small: [], inline: [], nested: [], markdown: [], native: [], wrapped: [] };
  const describe = (el: Element) => {
    let s = el.tagName.toLowerCase();
    const cls = [...el.classList].filter((c) => c.startsWith('ui-')).slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    const label = el.getAttribute('aria-label') || (el.textContent || '').trim();
    if (label) s += ' "' + label.slice(0, 24) + '"';
    return s;
  };
  const isInline = (el: Element, cs: CSSStyleDeclaration) => {
    if (!cs.display.startsWith('inline')) return false;
    const p = el.parentElement;
    return !!p && [...p.childNodes].some((n) => n.nodeType === 3 && !!n.textContent?.trim());
  };
  const visible = (el: Element) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0;
  };

  // 1. Horizontal overflow (checked at 390 px by the caller).
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') {
        const parent = el.parentElement?.getBoundingClientRect();
        if (!parent || parent.right <= vw + 1) out.overflow.push(`${describe(el)} right ${Math.round(r.right)} px`);
      }
      if (out.overflow.length >= 8) break;
    }
    if (!out.overflow.length) out.overflow.push(`page scrollWidth ${document.documentElement.scrollWidth} px`);
  }

  // 2. Touch targets under 48 px. A target counts a larger hit area drawn by ::before or ::after.
  // Links and buttons inside a line of text are exempt (WCAG 2.2, 2.5.8 inline exception) and listed apart.
  const sel =
    'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=option], [role=menuitem], [role=link], [tabindex]:not([tabindex="-1"])';
  for (const el of new Set(document.querySelectorAll<HTMLElement>(sel))) {
    if (el.closest('[aria-hidden="true"], [inert]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const input = el as HTMLInputElement;
    if ((input.type === 'checkbox' || input.type === 'radio') && el.closest('label')) continue;
    // An input inside a field box that focuses it on click uses the box as target.
    const box = el.tagName === 'INPUT' && el.closest('.ui-pwfield, .ui-datefield, .ui-ms, .ui-searchfield');
    if (box) {
      const br = box.getBoundingClientRect();
      if (br.height >= 47.5 && br.width >= 47.5) continue;
    }
    let w = r.width;
    let h = r.height;
    for (const pe of ['::before', '::after']) {
      const ps = getComputedStyle(el, pe);
      if (ps.content && ps.content !== 'none' && ps.position === 'absolute' && ps.pointerEvents !== 'none') {
        w = Math.max(w, parseFloat(ps.width) || 0);
        h = Math.max(h, parseFloat(ps.height) || 0);
      }
    }
    if (w >= 47.5 && h >= 47.5) continue;
    (isInline(el, cs) ? out.inline : out.small).push(`${describe(el)} ${Math.round(w)} x ${Math.round(h)} px`);
  }

  // 3. A card inside a card: two nested elements that both cast an outer shadow with blur.
  const cardLike = (el: Element) => {
    const sh = getComputedStyle(el).boxShadow;
    if (!sh || sh === 'none') return false;
    return sh.split(/,(?![^(]*\))/).some((x) => {
      const px = x.match(/(-?[\d.]+)px/g) || [];
      return !/inset/.test(x) && px.length >= 3 && parseFloat(px[2]) >= 4;
    });
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (out.nested.length >= 6) break;
    if (!cardLike(el) || !visible(el)) continue;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).position === 'fixed') break;
      if (cardLike(a)) {
        out.nested.push(`${describe(el)} inside ${describe(a)}`);
        break;
      }
    }
  }

  // 4. Markdown shown raw: backticks, **bold**, a heading mark at the start of a line.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n && out.markdown.length < 6; n = walker.nextNode()) {
    const t = n.textContent || '';
    const parent = n.parentElement;
    if (!parent || parent.closest('pre, code, script, style, textarea, .ui-cv') || !visible(parent)) continue;
    if (/`[^`]+`|\*\*[^*]+\*\*|^\s*#{1,6}\s/.test(t)) out.markdown.push(`${describe(parent)}: ${t.trim().slice(0, 40)}`);
  }

  // 5. Native controls that the design system replaces.
  const replacements: Record<string, string> = {
    select: 'Select',
    table: 'DataTable',
    dialog: 'Dialog',
    'input[type=checkbox]': 'Checkbox',
    'input[type=radio]': 'RadioGroup',
    'input[type=date]': 'DatePicker',
    progress: 'ProgressBar',
    'input[type=search]': 'SearchField',
    'input[type=file]': 'FileUpload',
    'input[type=color]': 'AccentPicker',
  };
  for (const [q, use] of Object.entries(replacements))
    // Controls a component renders carry its ui-* class; anything else is hand-written.
    for (const el of document.querySelectorAll(q)) if (visible(el) && !el.matches('[class^="ui-"], [class*=" ui-"]')) out.native.push(`<${q}> → use ${use}`);

  // 6. Text that must stay on one line: buttons, tabs, table headers, labels, headings.
  for (const el of document.querySelectorAll<HTMLElement>('.ui-btn, .ui-tab, [role=columnheader], .ui-field-label, h1, h2, h3, h4')) {
    if (out.wrapped.length >= 8 || !visible(el)) continue;
    // A text node that breaks onto a second line returns rects at different heights.
    const wraps = [...el.querySelectorAll('*'), el].some((node) =>
      [...node.childNodes].some((t) => {
        if (t.nodeType !== 3 || !t.textContent?.trim()) return false;
        const range = document.createRange();
        range.selectNodeContents(t);
        return new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top / 4))).size > 1;
      }),
    );
    if (wraps) out.wrapped.push(describe(el));
  }
  return out;
}
