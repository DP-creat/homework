// const firstName = 'John'
// const lastName = 'Smith'
// let age = 20

// console.log(firstName, lastName, age, 'y.o')

// age = 30

// console.log(age)

// /===================================/ 

// const x = 10
// const y = 20
// const result = x * y

// console.log(result)
// console.log(24%11)

// const firstNumber = 5
// const secondNumber = 10
// if (firstNumber == secondNumber) {
//   const result = firstNumber + secondNumber
//   console.log(result)
// } else {
//   const result = secondNumber - firstNumber
//   console.log(result)
// }

// const alex = 'admin'
// if (alex === 'user') {
//   console.log('Alex is user')
// } else if (alex === 'vip') {
//   console.log('Alex is vip user')
// } else if (alex === 'admin') {
//   console.log('Alex is Admin')
// } else {
//   console.log('Alex is Lol')
// }

// const alex = 'admin'
// alex === 'admin' ? console.log('Alex is Admin') : console.log('Alex is not Admin')

// /===================ЦЫКЛЫ=================================/
// let i = 0
// while(i < 10) {
//   i = i + 1    //  =  i++
//   console.log(i)
// }

// do {
//   i++
//   console.log(i)
// } while(i < 5)

// for (let i = 1; i <= 10 ; i++) {
//   console.log(`Пройден ${i} круг`)
// }

// for (let i = 1; i <= 10; i = i + 2) {
//   console.log(`Пройден ${i} круг`)
// }



// ======================МАССИВЫ=================================

// const numbers = [1, 2, 3, 4, 5]
// console.log(numbers)

// const numbers = [1, '2', true, [1, 2, 3], 5]
// console.log(numbers)

// const numbers = [1, 2, 3, 4, 5]
// console.log(numbers[0]) индекс первый, начинается от нуля

// const numbers = [1, 2, 3, 4, 5]
// numbers[4] = 6
// console.log(numbers)

// const numbers = [1, 2, 3, 4, 5]
// for (let i = 0; i < numbers.length; i++) {
//   console.log(numbers[i] + 1)
// }

// /====================ФУНКЦИИ========================/ 

// function sumNumbers() {
//   5 + 5
// }
// sumNumbers()

// function sumNumbers() {
//   return 5 + 5
// }
// const result = sumNumbers()
// console.log(result)

// function sumNumbers(firstNumber, secondNumber) {
//   return firstNumber + secondNumber
// }
// const result = sumNumbers(3, 10)
// console.log(result)
// console.log(sumNumbers(-2, 2))

// -------

// const users = ['John', 'Ann', 'Alex', 'Max']
// const nambers = [1, 2, 3]

// function checkForCopyItem = (array, item) => {
//   for (let i = 0; i < array.length; i++) {
//     if (array[i] === item) {
//       return `There is a copy of the ${item} in array`
//     }
//   }
//   return `There is no such item in the array`
// }

// console.log(checkForCopyItem(users, 'Alex'))
// console.log(checkForCopyItem(nambers, 6))

// --------------

// function hi(name) {
//   return `Hello ${name}!`
// }
// console.log(hi('Di'))

// ---------------------
// const nambers = [9, 10, 11]
// function checkForCopyItem(array) {
//   for (let i = 0; i < array.length; i++) {
//     if (array[i] > 10) {
//       return `${item}`
//     }
//   }
//   return `Eror`
// }
// console.log(checkForCopyItem(nambers))

// const numbers = [9, 10, 11]
// function checkNumbers(array) {
//   for (let i = 0; i < array.length; i++) {
//     if (array[i] > 10) {
//       console.log(array[i]);
//     }
//   }
// }
// checkNumbers(numbers);

// ===================ОБЪЕКТЫ=====================
// const user = {
// name: 'alex',
// age: 23,
// isAdmin: false
// }
// console.log(user.name)

// const users = {
//   alex: {
//     age: 23,
//     isAdmin: false
//   },
//   john: {
//     age: 20,
//     isAdmin: true,
//     sayHello(name) {
//       console.log(`Hello ${name}`)
//     }
//   }
// }
// console.log(users.alex, users.john)
// users.john.sayHello('Tom')


// const users = [
//   {
//     name: 'alex',
//     age: 23,
//     isAdmin: false
//   },
//   {
//     name: 'john',
//     age: 20,
//     isAdmin: true,
//   }
// ]
// users.push({
//   name: 'ivan',
//   age: 50,
//   isAdmin: true
// })

// for (let i = 0; i < users.length; i++) {
//   // console.log(users[i].age, users[i].name)
//   console.log(users[i])
// }

// const foo = 'hello world'
// console.log(foo.toUpperCase())

// function hi(name) {
//   return `Hello ${name}!`
// }
// console.log(hi('Di'))

const user = {
  denis: {
    age: 40,
    isAdmin: false,
    sayHello(name) {
      console.log(`Hello ${name}`)
    }
  }
}
user.denis.sayHello('Tom')

let users = [
  {
    name: "lola",
    role: "dev"
  },
  {
    name: "lisa",
    role: "user"
  },
  {
    name: "boo",
    role: "user"
  },
  {
    name: "di",
    role: "admin"
  },
];
let countUsersSimple = 0;
for (let i = 0; i < users.length; i++) {
  if (users[i].role === "user") {
    countUsersSimple++;
  }
}
console.log("Юзеров:", countUsersSimple);