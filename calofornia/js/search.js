export default function initSearchTags() {
  const searchInput = document.getElementById('searchInput');
  const tagsContainer = document.querySelector('.search-promo__tags');

  if (!searchInput || !tagsContainer) return;

  tagsContainer.addEventListener('click', (e) => {
    const tag = e.target.closest('.search-promo__tag');

    if (tag) {
      const tagText = tag.textContent.trim();
      
      searchInput.value = tagText;

      searchInput.focus();

      console.log(`Система: Поисковый запрос изменен на [${tagText}]`);
    }
  });
}