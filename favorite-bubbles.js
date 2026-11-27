"use strict";

// Add an accessible, decorative bubble-pop treatment to favorite controls.
const favoriteBubbleStyle = document.createElement('style');
favoriteBubbleStyle.textContent = `
  .favorite-button {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    padding: 0;
    border: 1px solid rgba(255,255,255,.92);
    border-radius: 50%;
    color: #a64e74;
    background: radial-gradient(circle at 32% 25%, rgba(255,255,255,.96) 0 8%, rgba(255,255,255,.55) 20%, rgba(244,178,205,.36) 58%, rgba(196,95,136,.2) 100%);
    box-shadow: inset -3px -4px 9px rgba(196,95,136,.12), inset 2px 2px 5px rgba(255,255,255,.9), 0 4px 12px rgba(145,73,104,.16);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    font-size: 23px;
    line-height: 1;
    touch-action: manipulation;
    transition: transform .18s ease, box-shadow .18s ease, color .18s ease, background .18s ease;
  }
  .favorite-button::before, .favorite-button::after {
    content: "";
    position: absolute;
    pointer-events: none;
    border-radius: 50%;
    opacity: 0;
  }
  .favorite-button::before { inset: -5px; border: 2px solid rgba(222,126,166,.62); }
  .favorite-button::after { inset: 3px; background: radial-gradient(circle, rgba(255,255,255,.95) 0 2px, transparent 3px); }
  .favorite-button:hover { transform: translateY(-2px) scale(1.06); box-shadow: inset -3px -4px 9px rgba(196,95,136,.12), inset 2px 2px 5px rgba(255,255,255,.9), 0 7px 16px rgba(145,73,104,.2); }
  .favorite-button:active { transform: scale(.9); }
  .favorite-button.active { color: #c44778; background: radial-gradient(circle at 32% 25%, rgba(255,255,255,.98) 0 8%, rgba(255,235,243,.74) 20%, rgba(238,151,185,.48) 62%, rgba(196,95,136,.28) 100%); }
  .favorite-button.pop::before { animation: favorite-bubble-pop .52s ease-out; }
  .favorite-button.pop::after { animation: favorite-bubble-glint .52s ease-out; }
  @keyframes favorite-bubble-pop { 0% { opacity:.9; transform:scale(.55); } 100% { opacity:0; transform:scale(1.65); } }
  @keyframes favorite-bubble-glint { 0% { opacity:.95; transform:scale(.5); } 100% { opacity:0; transform:scale(1.8); } }
  @media (prefers-reduced-motion: reduce) { .favorite-button, .favorite-button::before, .favorite-button::after { animation:none !important; transition:none !important; } }
`;
document.head.appendChild(favoriteBubbleStyle);

function setFavoriteHeart(button, active) {
  button.textContent = active ? '♥' : '♡';
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? 'お気に入りから削除' : 'お気に入りに追加');
}

const originalToggleCompanyFavorite = toggleCompanyFavorite;
toggleCompanyFavorite = function(company, button) {
  const wasFavorite = favoriteCompanies.has(getCompanyFavoriteKey(company));
  originalToggleCompanyFavorite(company, null);
  const isFavorite = favoriteCompanies.has(getCompanyFavoriteKey(company));
  if (button) {
    setFavoriteHeart(button, isFavorite);
    if (!wasFavorite && isFavorite) {
      button.classList.remove('pop');
      void button.offsetWidth;
      button.classList.add('pop');
      button.addEventListener('animationend', () => button.classList.remove('pop'), { once: true });
    }
  }
};

const originalCreateCompanyCard = createCompanyCard;
createCompanyCard = function(company, index) {
  const card = originalCreateCompanyCard(company, index);
  const button = card.querySelector('.favorite-button');
  if (button) {
    const active = favoriteCompanies.has(getCompanyFavoriteKey(company));
    setFavoriteHeart(button, active);
    button.addEventListener('click', () => {
      // The original card handler toggles the favorite before this listener.
      setFavoriteHeart(button, favoriteCompanies.has(getCompanyFavoriteKey(company)));
    });
  }
  return card;
};

const originalCreateRecommendationCard = createRecommendationCard;
createRecommendationCard = function(result) {
  const card = originalCreateRecommendationCard(result);
  const button = card.querySelector('.favorite-button');
  if (button) {
    const company = result.company;
    setFavoriteHeart(button, favoriteCompanies.has(getCompanyFavoriteKey(company)));
    button.addEventListener('click', () => {
      setFavoriteHeart(button, favoriteCompanies.has(getCompanyFavoriteKey(company)));
    });
  }
  return card;
};
