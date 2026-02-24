import HeaderFixed from "./header.js";
import BurgerMenu from "./burger.js";
import initDropdown from "./dropdown.js";
import initSearchTags from "./search.js";
import initModalSearch from "./modal-search.js";


const initHeroSlider = () => {
  const sliderSelector = '.hero__slider';
  
  if (!document.querySelector(sliderSelector)) return;

  return new Swiper(sliderSelector, {
    loop: true,
    speed: 1000,
    parallax: true, 
    
    autoplay: {
      delay: 7000,
      disableOnInteraction: false,
    },

    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      
    },

    
    navigation: {
      nextEl: '.hero__next',
      prevEl: '.hero__prev',
    },

    
    grabCursor: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
  });
};

try {
  const headerFixed = new HeaderFixed({
    HEADER: "header",
    HEADER_FIXED: "header--fixed",
  });

  new BurgerMenu(
    {
      BURGER: "burger",
      BURGER_OPEN: "burger--open",
      HEADER_MENU: "header__menu",
      HEADER_MENU_OPEN: "header__menu--open",
      lABEL: {
        OPEN: "Open menu",
        CLOSE: "Close menu",
      },
      PAGE_BODY: "page__body",
      PAGE_BODY_NO_SCROLL: "page__body--no-scroll",
      MENU_LINK: "menu__link",
      BREAKPOINT: 768,
      MAIN: "main",
    },
    headerFixed
  );

  initDropdown();

  initHeroSlider();

  initSearchTags();

  initModalSearch();
  
} catch (error) {
  console.error(error);
}
