export default function initDropdown() {
  const dropdownBtn = document.getElementById('dropdownBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  if (dropdownBtn && dropdownMenu) {
    const toggleMenu = (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('is-active');
      dropdownBtn.classList.toggle('is-active');
    };

    const closeMenu = () => {
      dropdownMenu.classList.remove('is-active');
      dropdownBtn.classList.remove('is-active');
    };

    dropdownBtn.addEventListener('click', toggleMenu);

    const links = dropdownMenu.querySelectorAll('.menu__link');
    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    dropdownBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') toggleMenu(e);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        closeMenu();
      }
    });
    window.addEventListener('scroll', () => {
      if (dropdownMenu.classList.contains('is-active')) {
        closeMenu();
      }
    }, { passive: true });
  }
}
