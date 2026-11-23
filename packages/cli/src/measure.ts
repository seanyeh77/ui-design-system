/* Runs inside the page (Playwright serializes this function): everything it needs is defined inside it. */
export interface Findings {
  overflow: string[];
  small: string[];
  inline: string[];
  nested: string[];
  markdown: string[];
  native: string[];
  wrapped: string[];
  /** Touch areas (::before / ::after) larger than their own control: on a static element they size against an ancestor. */
  escaped: string[];
  /** One row of a toolbar whose controls differ in height by more than 1 px. */
  mixed: string[];
  /** A status Badge with a shadow inside a table row or a card. */
  raised: string[];
  /** Page CSS outside any cascade layer, on element or universal selectors (resets, starter CSS), that overrides a declaration of a component. */
  unlayered: string[];
}

export function measure(): Findings {
  const out: Findings = {
    overflow: [],
    small: [],
    inline: [],
    nested: [],
    markdown: [],
    native: [],
    wrapped: [],
    escaped: [],
    mixed: [],
    raised: [],
    unlayered: [],
  };
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
        // Computed sizes are before any transform: scale them by the transforms on the control and its ancestors.
        let sx = 1;
        let sy = 1;
        for (let n: Element | null = el; n; n = n.parentElement) {
          const t = getComputedStyle(n).transform;
          if (!t || t === 'none') continue;
          const m = new DOMMatrixReadOnly(t);
          sx *= Math.hypot(m.a, m.b);
          sy *= Math.hypot(m.c, m.d);
        }
        const pw = (parseFloat(ps.width) || 0) * sx;
        const ph = (parseFloat(ps.height) || 0) * sy;
        // An area bigger than the control and the 48 px target is measured against an ancestor (the control is not
        // positioned): it covers other controls, up to the whole page. It does not count as this control's target.
        if (cs.position === 'static' || pw > Math.max(r.width, 48) + 1 || ph > Math.max(r.height, 48) + 1) {
          if (out.escaped.length < 8) out.escaped.push(`${describe(el)}${pe} ${Math.round(pw)} x ${Math.round(ph)} px`);
          continue;
        }
        w = Math.max(w, pw);
        h = Math.max(h, ph);
      }
    }
    if (w >= 47.5 && h >= 47.5) continue;
    // A selectable line in a LayerGraph: its label is the touch target; a line without one is hard to tap on phones,
    // which its README accepts. Listed with the exempt targets, not as a failure.
    if (el.matches('.ui-lg-hit')) {
      out.inline.push(`${describe(el)} line`);
      continue;
    }
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

  // 7. One row of controls with mixed heights: in a toolbar, controls on the same line must share one height.
  // A field box (search, password) counts as the control instead of its input; controls inside another control
  // (the clear button of a search field) are part of it. Only the outermost toolbar is measured.
  const bars = '.ui-dt-tools, .ui-dt-actions, .ui-card-actions, [role=toolbar]';
  const boxes = '.ui-searchfield, .ui-pwfield, .ui-datefield, .ui-ms, .ui-select';
  const controls = 'button, a[href], input:not([type=hidden]), [role=button], [role=combobox], ' + boxes;
  for (const bar of document.querySelectorAll(bars)) {
    if (out.mixed.length >= 6) break;
    if (bar.parentElement?.closest(bars) || !visible(bar)) continue;
    const items: { el: Element; r: DOMRect }[] = [];
    for (const el of bar.querySelectorAll(controls)) {
      const own = el.parentElement?.closest(controls);
      if ((own && bar.contains(own)) || !visible(el) || el.closest('[aria-hidden="true"]')) continue;
      items.push({ el, r: el.getBoundingClientRect() });
    }
    let hit = '';
    for (let i = 0; i < items.length && !hit; i++)
      for (let j = i + 1; j < items.length && !hit; j++) {
        const a = items[i].r;
        const b = items[j].r;
        const sameLine = Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
        if (sameLine && Math.abs(a.height - b.height) > 1)
          hit = `${describe(bar)}: ${describe(items[i].el)} ${Math.round(a.height)} px, ${describe(items[j].el)} ${Math.round(b.height)} px`;
      }
    if (hit) out.mixed.push(hit);
  }

  // 8. A raised status chip: inside a table row or a card a Badge is a dot and text, with no shadow of its own.
  for (const el of document.querySelectorAll('.ui-dt-body .ui-badge, .ui-card .ui-badge')) {
    if (out.raised.length >= 6) break;
    const sh = getComputedStyle(el).boxShadow;
    if (sh && sh !== 'none' && visible(el)) out.raised.push(describe(el));
  }

  // 9. Page CSS outside a layer that overrides a component. The system's CSS is in @layer ui, so any unlayered rule
  // wins over it, even `button { background: none }`: a reset, normalize or starter stylesheet (Vite's index.css)
  // restyles every component. Only rules on element or universal selectors (button, *, h1, ul li) count: a page's own
  // rule on a class is a deliberate override. A rule counts when a component rule on the same element declares the
  // same property with another value.
  interface Rule {
    selector: string;
    style: CSSStyleDeclaration;
    sheet: string;
  }
  const page: Rule[] = [];
  // The ui layer's rules by a class of their last compound (.ui-a .ui-b:hover under ui-b), so an element is matched
  // only against the rules that can style it; rules without one under ''.
  const system = new Map<string, Rule[]>();
  const parts = (sel: string) => sel.split(/,(?![^(]*\))/).map((x) => x.trim());
  const keys = (sel: string) => {
    const last =
      sel
        .replace(/\([^()]*\)/g, '')
        .split(/[\s>+~]+/)
        .pop() ?? '';
    const cls = [...last.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    return cls.length ? cls.slice(0, 1) : [''];
  };
  const applies = (rule: CSSRule) => {
    if (rule instanceof CSSMediaRule) return matchMedia(rule.conditionText).matches;
    if (rule instanceof CSSSupportsRule) return CSS.supports(rule.conditionText);
    return true;
  };
  const walk = (rules: CSSRuleList, sheet: string, layer: string | null) => {
    for (const rule of rules) {
      if (rule instanceof CSSImportRule) {
        const name = rule.layerName === null ? layer : [layer, rule.layerName].filter(Boolean).join('.');
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules, rule.styleSheet.href?.split('/').pop() || sheet, name);
        } catch {
          // a cross-origin sheet (web fonts): its rules cannot be read
        }
      } else if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules, sheet, [layer, rule.name].filter(Boolean).join('.'));
      else if (rule instanceof CSSStyleRule) {
        if (layer === null) page.push({ selector: rule.selectorText, style: rule.style, sheet });
        else if (layer === 'ui' || layer.startsWith('ui.'))
          for (const selector of parts(rule.selectorText))
            for (const k of keys(selector)) {
              const list = system.get(k) ?? [];
              list.push({ selector, style: rule.style, sheet });
              system.set(k, list);
            }
      } else if (rule instanceof CSSGroupingRule && applies(rule)) walk(rule.cssRules, sheet, layer);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules, sheet.href?.split('/').pop() || 'a <style> element', null);
    } catch {
      // cross-origin
    }
  }
  // Element and universal selectors only: no class, id, attribute or pseudo-class (::before and ::after are fine).
  const plain = (sel: string) => !/[.#[]|:(?!:)/.test(sel.replace(/::?(before|after|marker|placeholder)\b/g, ''));
  const matches = (el: Element, sel: string) => {
    try {
      return el.matches(sel);
    } catch {
      return false;
    }
  };
  // A longhand's value, or that of the shorthand that set it with var() (its longhands then read as '').
  const valueOf = (style: CSSStyleDeclaration, prop: string) => {
    const names = [prop];
    for (let p = prop; p.includes('-');) names.push((p = p.slice(0, p.lastIndexOf('-'))));
    const side = /^border-(?:top|right|bottom|left)-(color|width|style)$/.exec(prop);
    if (side) names.splice(2, 0, `border-${side[1]}`);
    for (const n of names) {
      const v = style.getPropertyValue(n).trim();
      if (v) return v;
    }
    return '';
  };
  const seen = new Set<string>();
  for (const rule of page) {
    if (out.unlayered.length >= 6) break;
    const selectors = parts(rule.selector).filter((x) => plain(x) && !/::/.test(x));
    if (!selectors.length) continue;
    const hits = new Map<string, string>(); // property -> component selector it overrides
    for (const el of document.querySelectorAll(selectors.join(', '))) {
      const classes = [...el.classList].filter((c) => c.startsWith('ui-'));
      if (!classes.length) continue;
      const candidates = [...classes, ''].flatMap((c) => system.get(c) ?? []);
      for (const prop of rule.style) {
        if (hits.has(prop)) continue;
        const value = valueOf(rule.style, prop);
        const own = candidates.find((r) => {
          const v = valueOf(r.style, prop);
          return v !== '' && v !== value && !r.style.getPropertyPriority(prop) && matches(el, r.selector);
        });
        if (own) hits.set(prop, own.selector);
      }
    }
    if (!hits.size) continue;
    const key = rule.sheet + rule.selector;
    if (seen.has(key)) continue;
    seen.add(key);
    const props = [...hits.keys()];
    out.unlayered.push(
      `${rule.selector} { ${props.slice(0, 4).join(', ')}${props.length > 4 ? ', …' : ''} } in ${rule.sheet} overrides ${[...new Set(hits.values())].slice(0, 2).join(', ')}`,
    );
  }
  return out;
}
