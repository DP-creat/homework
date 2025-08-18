// // найдем кнопку для открытия окна
// const btn = document.querySelector('.btn-open')
// // найдем само окно
// const modal = document.querySelector('.modal')

// //  навесим слушатель событий и будем добавлять класс на модалку, который будет перебивать этот дисплей нон
// btn.addEventListener('click', () => {
//   modal.classList.add('modal--open')
// })

// // при клике на модалку проверяем, если есть класс modal или класс modal__close-btn ОКОШКО ЗАКРЫВАЕТСЯ
// modal.addEventListener('click', event => {
//   const target = event.target
  
//   if (target && target.classList.contains('modal') || target.classList.contains('modal__close-btn')) {
//     modal.classList.remove('modal--open')
//   }
// })

// // события по нажатию кнопки
// document.addEventListener('keydown', event => {
//   // console.log(event.code)
//   // проверка на кнопку Эскейп и наличие класса modal--open
//   if (event.code === 'Escape' && modal.classList.contains ('modal--open')) {
//     modal.classList.toggle('modal--open') // вместо toggle был remove
//       }
// })

// ===============================
const btn = document.querySelector('.btn-open')
const modal = document.querySelector('.modal')
const body = document.body

const openModal = () => {
  modal.classList.add('modal--open')
  body.classList.add('body--fixed')
}

const closeModal = () => {
  modal.classList.remove('modal--open')
  body.classList.remove('body--fixed')
}

btn.addEventListener('click', openModal)

modal.addEventListener('click', event => {
  const target = event.target
  
  if (target && target.classList.contains('modal') || target.classList.contains('modal__close-btn')) {
    closeModal()
  }
})

document.addEventListener('keydown', event => {
  if (event.code === 'Escape' && modal.classList.contains ('modal--open')) {
    closeModal()
      }
})