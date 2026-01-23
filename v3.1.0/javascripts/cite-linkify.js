(function () {
  // Debug mode - set to true to enable console logging
  const DEBUG = false;

  function linkifyCitations(root) {
    const content = root.querySelector('[data-md-component="content"]') || root;

    // Find all citation groups (text ending with parenthesis followed by one or more sup elements)
    const allSups = content.querySelectorAll('sup > a.footnote-ref[href^="#fn:"], sup > a.footnote-ref[href^="#fn-"]');
    if (DEBUG) console.log('Found', allSups.length, 'citation superscripts');
    const processedSups = new Set();

    allSups.forEach((firstAnchor) => {
      const firstSup = firstAnchor.parentElement;
      if (!firstSup || processedSups.has(firstSup)) return;

      // Collect all consecutive sup elements (for multi-citations)
      const sups = [firstSup];
      let nextSibling = firstSup.nextSibling;

      // Skip whitespace and collect consecutive sup elements
      while (nextSibling) {
        if (nextSibling.nodeType === Node.TEXT_NODE && !nextSibling.textContent.trim()) {
          nextSibling = nextSibling.nextSibling;
          continue;
        }
        if (nextSibling.nodeType === Node.ELEMENT_NODE &&
            nextSibling.tagName === 'SUP' &&
            nextSibling.querySelector('a.footnote-ref')) {
          sups.push(nextSibling);
          nextSibling = nextSibling.nextSibling;
        } else {
          break;
        }
      }

      // Find the text node before the first sup
      let node = firstSup.previousSibling;
      while (node && node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.previousSibling;
      }
      if (!node) return;

      // Get the first href for the link (all refs point to the same footnote group conceptually)
      const href = firstAnchor.getAttribute('href');

      const linkifyTextNode = (textNode) => {
        const txt = textNode.textContent || '';
        // Match text ending with (Author, Year) - allow leading/trailing whitespace or newlines
        const m = txt.match(/^(\s*)(.*?)(\([^()]+\))(\s*)$/s);
        if (!m) {
          if (DEBUG) console.log('Regex failed to match:', txt);
          return false;
        }
        // m[1] = leading whitespace, m[2] = before text, m[3] = citation, m[4] = trailing whitespace
        const leadingSpace = m[1];
        const before = m[2];
        const paren = m[3];

        const wrap = document.createElement('span');
        if (leadingSpace) wrap.appendChild(document.createTextNode(leadingSpace));
        if (before) wrap.appendChild(document.createTextNode(before + ' '));

        // Create a container span that will hold all the anchor IDs
        const anchorContainer = document.createElement('span');
        anchorContainer.style.position = 'relative';

        // Transfer IDs from all sups to invisible anchor elements
        sups.forEach((sup, index) => {
          if (sup.id) {
            if (index === 0) {
              // First ID goes on the link itself
              anchorContainer.id = sup.id;
            } else {
              // Additional IDs need separate invisible anchors
              const anchor = document.createElement('span');
              anchor.id = sup.id;
              anchor.style.position = 'absolute';
              anchor.style.top = '0';
              anchorContainer.appendChild(anchor);
            }
            sup.removeAttribute('id');
          }
        });

        const link = document.createElement('a');
        link.className = 'citation-link';
        link.href = href;
        link.textContent = paren;

        anchorContainer.appendChild(link);
        wrap.appendChild(anchorContainer);

        textNode.parentNode.insertBefore(wrap, textNode);
        textNode.remove();
        return true;
      };

      let success = false;
      if (node.nodeType === Node.TEXT_NODE) {
        if (DEBUG) console.log('Text node content:', node.textContent);
        success = linkifyTextNode(node);
        if (DEBUG) console.log('Linkify success:', success);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (DEBUG) console.log('Element node:', node.tagName);
        // Try last text node in the element
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const texts = [];
        for (let t = walker.nextNode(); t; t = walker.nextNode()) texts.push(t);
        const lastText = texts.reverse().find(t => /\)\s*$/.test((t.textContent || '').trim()));
        if (lastText) {
          if (DEBUG) console.log('Last text content:', lastText.textContent);
          success = linkifyTextNode(lastText);
          if (DEBUG) console.log('Linkify success:', success);
        }
      } else {
        if (DEBUG) console.log('Node type:', node.nodeType, 'Content:', node.textContent);
      }

      // If we successfully created a link, hide all the sup elements
      if (success) {
        sups.forEach((sup, index) => {
          sup.classList.add('citation-footnote');
          processedSups.add(sup);

          // Remove whitespace after each sup (between consecutive sups and after the last one)
          let nextNode = sup.nextSibling;
          while (nextNode && nextNode.nodeType === Node.TEXT_NODE && !nextNode.textContent.trim()) {
            const toRemove = nextNode;
            nextNode = nextNode.nextSibling;
            toRemove.remove();
          }
        });
      }
    });
  }

  // Normal MkDocs
  document.addEventListener('DOMContentLoaded', () => {
    // Run immediately
    linkifyCitations(document);

    // Also run after a short delay in case MathJax is still processing
    setTimeout(() => linkifyCitations(document), 500);
  });

  // Material's instant navigation
  if (window.document$ && typeof window.document$.subscribe === 'function') {
    window.document$.subscribe(() => {
      linkifyCitations(document);
      setTimeout(() => linkifyCitations(document), 500);
    });
  }

  // Also run when the page is fully loaded (after all resources)
  window.addEventListener('load', () => {
    setTimeout(() => linkifyCitations(document), 100);
  });
})();
