export default function initModalSearch() {
  const searchBtn = document.querySelector('.header__actions-button[title="Search"]');
  const searchModal = document.getElementById('searchModal');
  const closeSearch = document.getElementById('closeSearch');
  const modalInput = document.getElementById('modalSearchInput');


  if (!searchBtn || !searchModal || !closeSearch) return;

  const openModal = () => {
    searchModal.classList.add('header__search-modal--open');

    document.body.classList.add('page__body--no-scroll');
    setTimeout(() => modalInput.focus(), 100);
  };

  const closeModal = () => {
    searchModal.classList.remove('header__search-modal--open');
    document.body.classList.remove('page__body--no-scroll');
    modalInput.value = '';
  };

  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  closeSearch.addEventListener('click', closeModal);


  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeModal();
  });


  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal.classList.contains('header__search-modal--open')) {
      closeModal();
    }
  });
}