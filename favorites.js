'use strict';

// Appearance-only favorites: selections last only until the page is reloaded.
(() => {
  const favorites = new Set();
  const buttonClass = 'company-favorite-button';
  const styleId = 'company-favorites-style';

  function installStyles() {
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .company-card { position: relative; }
      .${buttonClass} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        margin: 0 0 10px auto;
        padding: 0;
        border: 1px solid #e8c5d0;
        border-radius: 50%;
        color: #a45b72;
        background: #fff;
        font: inherit;
        font-size: 25px;
        line-height: 1;
        cursor: pointer;
        transition: color .18s ease, background .18s ease, transform .18s ease;
      }
      .${buttonClass}:hover { transform: scale(1.08); }
      .${buttonClass}[aria-pressed="true"] {
        color: #fff;
        border-color: #e85d91;
        background: #e85d91;
      }
      .${buttonClass}:focus-visible { outline: 3px solid #ad3565; outline-offset: 3px; }
    `;
    document.head.appendChild(style);
  }

  function addFavoriteButton(card) {
    if (card.querySelector(`.${buttonClass}`)) return;
    const heading = card.querySelector('h3');
    if (!heading) return;

    const name = heading.textContent.trim();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = buttonClass;
    button.textContent = favorites.has(name) ? '♥' : '♡';
    button.setAttribute('aria-label', `${name}をお気に入りに登録`);
    button.setAttribute('aria-pressed', String(favorites.has(name)));

    button.addEventListener('click', () => {
      const isFavorite = !favorites.has(name);
      if (isFavorite) favorites.add(name);
      else favorites.delete(name);

      button.textContent = isFavorite ? '♥' : '♡';
      button.setAttribute('aria-pressed', String(isFavorite));
      button.setAttribute('aria-label', `${name}をお気に入り${isFavorite ? '解除' : '登録'}`);
    });

    card.insertBefore(button, heading);
  }

  function scanCards(root = document) {
    if (root.matches?.('.company-card')) addFavoriteButton(root);
    root.queryAll?.('.company-card');
    root.querySelectorAll?.('.company-card').forEach(addFavoriteButton);
  }

  function initialize() {
    installStyles();
    scanCards();

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scanCards(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
