(function () {

  // Бургер

  document.addEventListener('click', burgerInit)

  function burgerInit(e) {

    const burgerIcon = e.target.closest('.burger-icon')
    const burgerNavLink = e.target.closest('.nav__link')

    if (!burgerIcon && !burgerNavLink) return
    if (document.documentElement.clientWidth > 900) return

    if (!document.body.classList.contains('body--opened-menu')) {
      document.body.classList.add('body--opened-menu')
    } else { document.body.classList.remove('body--opened-menu') }
  }

  // Модалка

  const modal = document.querySelector('.modal')
  const modalButton = document.querySelector('.about__img-button')

  modalButton.addEventListener('click', openModal)
  modal.addEventListener('click', closeModal)

  function openModal(e) {
    e.preventDefault()
    document.body.classList.toggle('body--opened-modal')
  }

  function closeModal(e) {
    e.preventDefault()

    const target = e.target
    if (target.closest('.modal__cansel') || target.classList.contains('modal')) {
      document.body.classList.remove('body--opened-modal')
    }
  }

  // Табы

  const tabControls = document.querySelector('.tab-controls')

  tabControls.addEventListener('click', toggleTab)

  function toggleTab(e) {
    const tabControl = e.target.closest('.tab-controls__link')

    if (!tabControl) return
    e.preventDefault()
    if (tabControl.classList.contains('tab-controls__link--active')) return

    const tabContentID = tabControl.getAttribute('href')
    const tabContent = document.querySelector(tabContentID)
    const activeControl = document.querySelector('.tab-controls__link--active')
    const activeContent = document.querySelector('.tab-content--show')

    if (activeControl) {
      activeControl.classList.remove('tab-controls__link--active')
    }
    if (activeContent) {
      activeContent.classList.remove('tab-content--show')
    }
    tabControl.classList.add('tab-controls__link--active')
    tabContent.classList.add('tab-content--show')
  }

  // const tabControls = document.querySelector('.tab-controls')

  // tabControls.addEventListener('click', toggleTab)

  // function toggleTab(e) {
  //   const tabControl = e.target.closest('.tab-controls__link')

  //   if (!tabControl) return
  //   e.preventDefault()
  //   if (tabControl.classList.contains('tab-controls__link--active')) return

  //   const tabContentID = tabControl.getAttribute('href')

  //   document.querySelector('.tab-content--show').classList.remove('tab-content--show')
  //   document.querySelector(tabContentID).classList.add('tab-content--show')

  //   document.querySelector('.tab-controls__link--active').classList.remove('tab-controls__link--active')
  //   tabControl.classList.add('tab-controls__link--active')
  // }

  // Аккордион


  // const accordionLists = document.querySelectorAll('.accordion-list');

  // accordionLists.forEach(el => {

  //   el.addEventListener('click', (e) => {

  //     const accordionControl = e.target.closest('.accordion-list__control');
  //     if (!accordionControl) return;
  //     const accordionItem = accordionControl.parentElement;
  //     const accordionContent = accordionControl.nextElementSibling;

  //     accordionItem.classList.toggle('accordion-list__item--opened');

  //     if (accordionItem.classList.contains('accordion-list__item--opened')) {
  //       accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
  //     } else {
  //       accordionContent.style.maxHeight = null;
  //     }
  //   });
  // });

  // const accordionLists = document.querySelectorAll('.accordion-list');

  // accordionLists.forEach(el => {

  //   // document.querySelector('.accordion-list__item--opened .accordion-list__content').style.maxHeight = document.querySelector('.accordion-list__item--opened .accordion-list__content').scrollHeight + 'px';

  //   el.addEventListener('click', (e) => {

  //     const accordionList = e.currentTarget
  //     const accordionOpenedItem = accordionList.querySelector('.accordion-list__item--opened');
  //     const accordionOpenedContent = accordionList.querySelector('.accordion-list__item--opened .accordion-list__content');
      
  //     const accordionControl = e.target.closest('.accordion-list__control');
  //     if (!accordionControl) return;
  //     const accordionItem = accordionControl.parentElement;
  //     const accordionContent = accordionControl.nextElementSibling;

  //     if (accordionOpenedItem) {
  //       accordionOpenedItem.classList.remove('accordion-list__item--opened');
  //       accordionOpenedItem.style.maxHeight = null;
  //     }
  //     accordionItem.classList.toggle('accordion-list__item--opened');

  //     if (accordionItem.classList.contains('accordion-list__item--opened')) {
  //       accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
  //     } else {
  //       accordionContent.style.maxHeight = null;
  //     }
  //   });
  // });

  const accordionLists = document.querySelectorAll('.accordion-list');

  accordionLists.forEach(el => {
    function closeAllAccordionItems(currentList) {
      const openItems = currentList.querySelectorAll('.accordion-list__item--opened');
      openItems.forEach(item => {
        item.classList.remove('accordion-list__item--opened');
        const content = item.querySelector('.accordion-list__content');
        if (content) {
          content.style.maxHeight = null;
        }
      });
    }

    el.addEventListener('click', (e) => {
      const accordionControl = e.target.closest('.accordion-list__control');
      if (!accordionControl) return;

      const accordionItem = accordionControl.parentElement;
      const accordionContent = accordionControl.nextElementSibling;
      const isOpened = accordionItem.classList.contains('accordion-list__item--opened');

      if (isOpened) {
        accordionItem.classList.remove('accordion-list__item--opened');
        accordionContent.style.maxHeight = null;
        return;
      }

      closeAllAccordionItems(el);

      accordionItem.classList.add('accordion-list__item--opened');
      accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
    });

    el.querySelectorAll('.accordion-list__item--opened').forEach(item => {
      const content = item.querySelector('.accordion-list__content');
      if (content) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

})()

