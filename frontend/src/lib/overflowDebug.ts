// Development helper to locate elements that overflow the viewport.
// Usage (in browser console):
//   window.__overflowDebug.list();
//   window.__overflowDebug.highlight();
//   window.__overflowDebug.clear();

export function listOverflowingElements() {
  const docW = document.documentElement.clientWidth;
  const els = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
  const overflowers = els
    .filter((el) => {
      try {
        return el.scrollWidth > docW && el.offsetParent !== null;
      } catch (e) {
        return false;
      }
    })
    .map((el, i) => ({
      el,
      tag: el.tagName.toLowerCase(),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      id: el.id || null,
      classes: el.className ? String(el.className).slice(0, 200) : '',
      index: i,
    }));

  console.table(
    overflowers.map((o) => ({
      selector: o.id ? `#${o.id}` : `${o.tag}${o.classes ? '.' + o.classes.replace(/\s+/g, '.') : ''}`,
      scrollWidth: o.scrollWidth,
      clientWidth: o.clientWidth,
    }))
  );

  return overflowers;
}

export function highlightOverflowingElements() {
  const overflowers = listOverflowingElements();
  overflowers.forEach((o, idx) => {
    try {
      o.el.classList.add('overflow-debug-outline');
      o.el.classList.add('overflow-debug-label');
      o.el.setAttribute('data-ov-id', `${o.scrollWidth}w`);
    } catch (e) {
      // ignore
    }
  });
  return overflowers;
}

export function clearHighlights() {
  const els = Array.from(document.querySelectorAll('.overflow-debug-outline, .overflow-debug-label')) as HTMLElement[];
  els.forEach((el) => {
    el.classList.remove('overflow-debug-outline');
    el.classList.remove('overflow-debug-label');
    el.removeAttribute('data-ov-id');
  });
}

// Expose on window for easy access in devtools
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__overflowDebug = {
    list: listOverflowingElements,
    highlight: highlightOverflowingElements,
    clear: clearHighlights,
  };
}
