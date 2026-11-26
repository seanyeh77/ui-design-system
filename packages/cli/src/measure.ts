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
  /** Whether the page has <meta name="viewport">: without it a phone lays the page out 980 px wide. */
  viewportMeta: boolean;
  /** Interface text cut off by overflow: hidden or an ellipsis, with no tooltip or title giving the full text. */
  truncated: string[];
  /** Text that lies outside the box of its card (an axis label drawn past the edge), shown over it or clipped away. */
  outside: string[];
  /** Targets under 24 x 24 px whose 24 px circle meets another target (WCAG 2.2, 2.5.8): the desktop minimum. */
  small24: string[];
  /** Fields side by side in one form row (a FormGrid row, a flex row of fields) whose controls differ in height by more than 1 px. */
  formMixed: string[];
  /** Paragraphs of two or more lines set in text-align: center (reported by the caller at 390 px only). */
  centered: string[];
  /** An AppShell page whose document scrolls as well as its own main area: scrollHeight against the window height. */
  docScroll: string;
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
    viewportMeta: !!document.querySelector('meta[name="viewport" i]'),
    truncated: [],
    outside: [],
    small24: [],
    formMixed: [],
    centered: [],
    docScroll: '',
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
  // Text only for screen readers: a 1 px box, or clipped away (clip: rect(0 0 0 0), clip-path: inset(50%)).
  const srOnly = (el: Element, cs = getComputedStyle(el)) => {
    const r = el.getBoundingClientRect();
    return (r.width <= 1 && r.height <= 1) || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip) || cs.clipPath === 'inset(50%)';
  };
  const visible = (el: Element) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0 && !srOnly(el, cs);
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
  const control = sel.replace(', [tabindex]:not([tabindex="-1"])', '') + ', [role=slider], [role=separator], [role=combobox], [role=treeitem]';
  // A link whose whole row or card opens it too (DataTable's a.ui-dt-rowlink, a card that is clickable as a whole): the
  // row is the touch target. An ancestor up to the row or card that shows a pointer and is at least 48 px tall counts.
  const wholeRow = (el: Element) => {
    if (el.matches('.ui-dt-rowlink')) return true;
    if (!el.matches('a[href]')) return false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).cursor === 'pointer' && a.getBoundingClientRect().height >= 47.5) return true;
      if (a.matches('tr, [role=row], li, [role=listitem], .ui-card, article')) break;
    }
    return false;
  };
  // Every target's box, for the 24 px spacing check below.
  const targets: { el: HTMLElement; r: DOMRect; w: number; h: number; inline: boolean }[] = [];
  // In a line of text (a link in a sentence, a code reference in a list item, anything in Markdown content) a target's
  // size is set by the line height: WCAG 2.5.8 exempts it.
  const inText = (el: Element, cs: CSSStyleDeclaration) => isInline(el, cs) || cs.display === 'inline' || !!el.closest('.ui-md');
  // A term in a sentence (Term variant="inline", or the default Term beside text) is exempt like a link in a sentence,
  // also when the text around it sits in sibling elements rather than in the term's own parent.
  const inSentence = (el: Element, cs: CSSStyleDeclaration) => isInline(el, cs) || el.matches('.ui-term.is-word, .ui-term.is-inline');
  for (const el of new Set(document.querySelectorAll<HTMLElement>(sel))) {
    if (el.closest('[aria-hidden="true"], [inert]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || srOnly(el, cs)) continue;
    // A region focusable only so the keyboard can scroll it (a code block, pre.ui-cv-body; a Markdown table,
    // .ui-md-table-wrap; any scroll box with tabindex="0"): content, not a control. Tapping it does nothing, and a
    // finger scrolls it anyway. Only an element with no control tag or widget role counts.
    if (!el.matches(control) && /auto|scroll/.test(cs.overflowX + ' ' + cs.overflowY)) continue;
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
    targets.push({ el, r, w, h, inline: inText(el, cs) || inSentence(el, cs) });
    if (w >= 47.5 && h >= 47.5) continue;
    if (wholeRow(el)) {
      out.inline.push(`${describe(el)} (its row or card is the target)`);
      continue;
    }
    // A selectable line in a LayerGraph: its label is the touch target; a line without one is hard to tap on phones,
    // which its README accepts. Listed with the exempt targets, not as a failure.
    if (el.matches('.ui-lg-hit')) {
      out.inline.push(`${describe(el)} line`);
      continue;
    }
    (inSentence(el, cs) ? out.inline : out.small).push(`${describe(el)} ${Math.round(w)} x ${Math.round(h)} px`);
  }

  // 2b. Targets under 24 x 24 px (WCAG 2.2, 2.5.8, the minimum on any screen). The spacing exception: an undersized
  // target passes when a 24 px circle on its center meets no other target and no other undersized target's circle.
  // Inline links in text and the exempt lines above are left out, as in the 48 px check.
  for (const t of targets) {
    if (out.small24.length >= 60) break;
    if (t.w >= 23.5 && t.h >= 23.5) continue;
    if (t.inline || t.el.matches('.ui-lg-hit') || wholeRow(t.el)) continue;
    const cx = t.r.left + t.r.width / 2;
    const cy = t.r.top + t.r.height / 2;
    // A target under an open menu or popover cannot be reached until it closes: not counted while covered.
    if (cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight) {
      const top = document.elementFromPoint(cx, cy);
      if (top && !t.el.contains(top) && !top.contains(t.el)) continue;
    }
    const near = targets.find((o) => {
      if (o === t || o.el.contains(t.el) || t.el.contains(o.el)) return false;
      // Distance from this center to the other target's box, and to the other's center when it is undersized too.
      const dx = Math.max(o.r.left - cx, 0, cx - o.r.right);
      const dy = Math.max(o.r.top - cy, 0, cy - o.r.bottom);
      if (Math.hypot(dx, dy) < 12) return true;
      const small = o.w < 23.5 || o.h < 23.5;
      return small && Math.hypot(o.r.left + o.r.width / 2 - cx, o.r.top + o.r.height / 2 - cy) < 24;
    });
    if (near) out.small24.push(`${describe(t.el)} ${Math.round(t.w)} x ${Math.round(t.h)} px, next to ${describe(near.el)}`);
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
  const UI_CLASS = '[class^="ui-"], [class*=" ui-"]';
  // Buttons, links and text fields too: a hand-written one misses the focus ring, the sizes and the states.
  replacements.button = 'Button or IconButton';
  replacements['a[href]'] = 'Link';
  replacements['input:is(:not([type]), [type=text], [type=email], [type=password], [type=number], [type=tel], [type=url])'] = 'TextField';
  replacements.textarea = 'TextArea';
  for (const [q, use] of Object.entries(replacements))
    // Controls a component renders carry its ui-* class; Markdown content holds what its author wrote (links). Anything
    // else is hand-written.
    for (const el of document.querySelectorAll(q))
      if (visible(el) && !el.matches(UI_CLASS) && !el.closest('.ui-md')) out.native.push(`${describe(el)} → use ${use}`);

  // 6. Text that must stay on one line: buttons, tabs, table headers, labels, interface headings. Headings in
  // Markdown content (.ui-md-h) are written by the document's author, whose length the page cannot control: they wrap.
  for (const el of document.querySelectorAll<HTMLElement>('.ui-btn, .ui-tab, [role=columnheader], .ui-field-label, h1, h2, h3, h4')) {
    if (out.wrapped.length >= 8 || !visible(el) || el.matches('.ui-md-h')) continue;
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

  // 6b. Interface text cut off: a button, tab, table header, heading or title whose text overflows its box under
  // overflow: hidden or text-overflow: ellipsis. Passes when the full text is at hand: a title attribute, a Tooltip
  // (data-ui-tip) or an aria-label on the element or around it. Markdown content is the author's and is left out.
  const titled = (n: Element, el: Element) => {
    if (n.closest('[title], [data-ui-tip]')) return true;
    const named = n.closest('[aria-label]');
    return !!named && (named === el || el.contains(named));
  };
  const cut = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'visible' && cs.textOverflow !== 'ellipsis') return false;
    if (/auto|scroll/.test(cs.overflowX)) return false;
    return el.scrollWidth > el.clientWidth + 1 && !!el.textContent?.trim();
  };
  const labels = '.ui-btn, .ui-tab, [role=tab], [role=columnheader], h1, h2, h3, h4, h5, h6, [class*="-title"]';
  // Titles are the system's ui-…-title classes (ui-card-title, ui-dialog-title); other classes that only contain "-title" are not.
  const isLabel = (el: Element) =>
    !el.matches('[class*="-title"]') || el.matches(labels.replace(', [class*="-title"]', '')) || [...el.classList].some((c) => /^ui-[\w-]+-title$/.test(c));
  for (const el of [...document.querySelectorAll<HTMLElement>(labels)].filter(isLabel)) {
    if (out.truncated.length >= 30) break;
    if (!visible(el) || el.closest('.ui-md, .ui-md-h, [aria-hidden="true"]')) continue;
    const hit = [el, ...el.querySelectorAll<HTMLElement>('*')].find((n) => visible(n) && cut(n) && !titled(n, el));
    if (hit) out.truncated.push(`${describe(el)}: "${(hit.textContent || '').trim().slice(0, 32)}" is cut off`);
  }

  // 6c. Text outside its card: a label (a chart's axis label, a long word) that lies past the card's edge, drawn over
  // the border or clipped away. Text inside a scroll box within the card scrolls into view and is left out. Text clipped
  // by an element inside the card (overflow hidden or clip, as text-overflow: ellipsis needs) is measured by the part
  // that shows: its box cut to that element's box.
  for (const card of document.querySelectorAll<HTMLElement>('.ui-card')) {
    if (out.outside.length >= 6) break;
    if (!visible(card)) continue;
    const box = card.getBoundingClientRect();
    const scrolls = (n: Element) => {
      for (let a = n.parentElement; a && a !== card; a = a.parentElement)
        if (/auto|scroll/.test(getComputedStyle(a).overflowX + getComputedStyle(a).overflowY)) return true;
      return false;
    };
    const past = (r: DOMRect) =>
      r.width > 1 && r.height > 1 && (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1);
    const walkText = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    for (let n = walkText.nextNode(); n; n = walkText.nextNode()) {
      const parent = n.parentElement;
      if (!parent || !n.textContent?.trim() || !visible(parent) || scrolls(parent)) continue;
      // Visually hidden text (clip: rect(0 0 0 0), 1 px boxes) is for screen readers.
      if (parent.closest('[class*="sr-only"], [class*="visually-hidden"]') || getComputedStyle(parent).position === 'fixed') continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const clipTo = (r: DOMRect) => {
        let { left, right, top, bottom } = r;
        for (let a: Element | null = parent; a && a !== card; a = a.parentElement) {
          const cs = getComputedStyle(a);
          const ab = a.getBoundingClientRect();
          if (/hidden|clip/.test(cs.overflowX)) {
            left = Math.max(left, ab.left);
            right = Math.min(right, ab.right);
          }
          if (/hidden|clip/.test(cs.overflowY)) {
            top = Math.max(top, ab.top);
            bottom = Math.min(bottom, ab.bottom);
          }
        }
        return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
      };
      const r = [...range.getClientRects()].map(clipTo).find(past);
      if (r) {
        out.outside.push(
          `${describe(card)}: "${n.textContent.trim().slice(0, 24)}" ${Math.round(Math.max(box.left - r.left, r.right - box.right, box.top - r.top, r.bottom - box.bottom))} px outside`,
        );
        break;
      }
    }
  }

  // 7. One row of controls with mixed heights: in a toolbar, controls on the same line must share one height.
  // A field box (search, password) counts as the control instead of its input, and a tab list (a segmented control)
  // instead of its tabs; controls inside another control (the clear button of a search field) are part of it. Only
  // the outermost toolbar is measured.
  const bars = '.ui-dt-tools, .ui-dt-actions, .ui-card-actions, [role=toolbar]';
  const boxes = '.ui-searchfield, .ui-pwfield, .ui-datefield, .ui-field-box, .ui-ms, .ui-select, [role=tablist]';
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

  // 7b. Fields side by side in a form: the controls of one row (a FormGrid row, or fields in one flex row) share one
  // height, as in a toolbar. The control of a field is its outermost input box (a field box, a select trigger, an
  // input); a TextArea is taller on purpose and is left out. Fields in a toolbar are measured by 7.
  const fieldControls = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), [role=combobox], ' + boxes + ', .ui-input';
  const rows = new Map<Element, { field: Element; el: Element; r: DOMRect }[]>();
  for (const field of document.querySelectorAll('.ui-field')) {
    if (field.parentElement?.closest('.ui-field') || field.closest(bars) || !visible(field)) continue;
    const el = [...field.querySelectorAll(fieldControls)].find((c) => {
      const own = c.parentElement?.closest(fieldControls);
      return !(own && field.contains(own)) && visible(c) && !c.closest('[aria-hidden="true"], [role=listbox], [role=dialog]');
    });
    if (!el || el.matches('textarea') || el.querySelector('textarea')) continue;
    // The row: the nearest ancestor that lays its children out side by side (a grid, or a flex row).
    let row: Element | null = field.parentElement;
    for (; row && row !== document.body; row = row.parentElement) {
      const cs = getComputedStyle(row);
      if (/grid/.test(cs.display) || (/flex/.test(cs.display) && !cs.flexDirection.startsWith('column'))) break;
    }
    if (!row || row === document.body) continue;
    rows.set(row, [...(rows.get(row) ?? []), { field, el, r: el.getBoundingClientRect() }]);
  }
  for (const [row, items] of rows) {
    if (out.formMixed.length >= 6) break;
    let hit = '';
    for (let i = 0; i < items.length && !hit; i++)
      for (let j = i + 1; j < items.length && !hit; j++) {
        const a = items[i].r;
        const b = items[j].r;
        const sameLine = Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
        if (sameLine && Math.abs(a.height - b.height) > 1) {
          const name = (f: Element) => f.querySelector('.ui-field-label, label')?.textContent?.trim().slice(0, 16) || describe(f);
          hit = `${describe(row)}: "${name(items[i].field)}" ${Math.round(a.height)} px, "${name(items[j].field)}" ${Math.round(b.height)} px`;
        }
      }
    if (hit) out.formMixed.push(hit);
  }

  // 7c. Long text centered: a paragraph of two or more lines in text-align: center is hard to read on a phone (each
  // line starts somewhere else). Only blocks of running text count (at least 160 px wide, with inline content only);
  // labels, buttons, table cells and chart labels are short and left out, and so are EmptyState and ErrorPage, whose
  // title and short description are centered by design.
  for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
    if (out.centered.length >= 6) break;
    const cs = getComputedStyle(el);
    if (!/center/.test(cs.textAlign) || cs.display.startsWith('inline') || /flex|grid/.test(cs.display)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && !!n.textContent?.trim())) continue;
    if ([...el.children].some((c) => !getComputedStyle(c).display.startsWith('inline') && getComputedStyle(c).display !== 'none')) continue;
    if (
      el.closest(
        '.ui-empty, .ui-errorpage, button, [role=button], td, th, [role=cell], [role=gridcell], [role=columnheader], svg, .ui-md table, [aria-hidden="true"]',
      )
    )
      continue;
    if (!visible(el) || el.getBoundingClientRect().width < 160) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top / 4))).size;
    if (lines >= 2) out.centered.push(`${describe(el)} (${lines} lines)`);
  }

  // 7d. A page in AppShell scrolls inside its main area (.ui-shell-main); when the document scrolls too, the page
  // has two scroll bars and the top bar scrolls away (page padding or margin around the frame, content past it).
  if (document.querySelector('.ui-shell')) {
    const doc = document.scrollingElement ?? document.documentElement;
    if (doc.scrollHeight > innerHeight + 1) out.docScroll = `document ${doc.scrollHeight} px tall in a ${innerHeight} px window`;
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
