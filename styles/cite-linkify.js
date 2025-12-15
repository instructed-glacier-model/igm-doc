(function () {
  function linkifyCitations(root) {
    const content = root.querySelector('[data-md-component="content"]') || root;

    // Grab ANY footnote anchor inside a <sup> that points to "#fn:" or "#fn-"
    const anchors = content.querySelectorAll('sup > a[href^="#fn:"], sup > a[href^="#fn-"]');

    anchors.forEach((a) => {
      const sup = a.parentElement;
      if (!sup) return;

      // Walk back to the node with the trailing "(...)" to wrap as a link
      let node = sup.previousSibling;
      while (node && node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.previousSibling;
      }
      if (!node) return;

      const href = a.getAttribute('href');

      const linkifyTextNode = (textNode) => {
        const txt = textNode.textContent || '';
        const m = txt.match(/^(.*?)(\s*\([^()]*\))\s*$/);
        if (!m) return false;
        const before = m[1];
        const paren  = m[2].trim();

        const wrap = document.createElement('span');
        if (before) wrap.appendChild(document.createTextNode(before + ' '));

        const link = document.createElement('a');
        link.className = 'citation-link';
        link.href = href;
        link.textContent = paren;
        wrap.appendChild(link);

        textNode.parentNode.insertBefore(wrap, textNode);
        textNode.remove();
        return true;
      };

      if (node.nodeType === Node.TEXT_NODE) {
        if (linkifyTextNode(node)) {
          sup.classList.add('citation-footnote');
          return;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Try last text node in the element
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const texts = [];
        for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t);
        const lastText = texts.reverse().find(t => /\)\s*$/.test((t.textContent || '').trim()));
        if (lastText && linkifyTextNode(lastText)) {
          sup.classList.add('citation-footnote');
          return;
        }
        // Fallback: wrap the whole element if it ends with ")"
        const textContent = (node.textContent || '').trim();
        if (/\)\s*$/.test(textContent)) {
          const link = document.createElement('a');
          link.className = 'citation-link';
          link.href = href;
          node.parentNode.insertBefore(link, node);
          link.appendChild(node);
          sup.classList.add('citation-footnote');
        }
      }
    });
  }

  // Normal MkDocs
  document.addEventListener('DOMContentLoaded', () => linkifyCitations(document));

  // Material’s instant navigation
  if (window.document$ && typeof window.document$.subscribe === 'function') {
    window.document$.subscribe(() => linkifyCitations(document));
  }
})();
