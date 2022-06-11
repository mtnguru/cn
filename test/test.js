const fs = require('fs');

console.log('starting')

var util = require("node:util");
var read = util.promisify(fs.readFile);

// Run 4 readFile promises in series
const readFiles1 = () => {
  const start = performance.now();
  read('file1')
    .then(data1 => {
      console.log('enter then readFile 1: ', data1.toString())
      return read('file2');
    })
    .then(data2 => {
      console.log('enter then readFile 2: ', data2.toString())
      return read('file3')
    })
    .then(data3 => {
      console.log('enter then readFile 3: ', data3.toString())
      return read('file4');
    })
    .then(data4 => {
      console.log('enter then readFile 4: ', data4.toString())
      const end = performance.now();
      console.log('time1 = ', end - start)
    })
    .catch(err => {
      console.log('Error: ', err)
    })
}

// Create a promise and run all promises simultaneously
const readFiles2 = () => {
  const start = performance.now();
  console.log('start ======== ', performance.now());

  Promise
    .all([
      read('file1'),
      read('file2'),
      read('file3'),
      read('file4'),
    ])
    .then (data => {
      const [data1, data2, data3, data4 ]  = data
      console.log('file 1: ', data1.toString())
      console.log('file 2: ', data2.toString())
      console.log('file 3: ', data3.toString())
      console.log('file 4: ', data4.toString())
      const end = performance.now();
      console.log('time2 = ', end - start)
    })
    .catch(err => {
      console.log('Error: ', err)
    })
}

// Use async and await to read the files
const readFiles3 = async () => {
  const start = performance.now();
  const data1 = await read('file1');
  const data2 = await read('file2');
  const data3 = await read('file3');
  const data4 = await read('file4');

  console.log('file 1: ', data1.toString())
  console.log('file 2: ', data2.toString())
  console.log('file 3: ', data3.toString())
  console.log('file 4: ', data4.toString())

  const end = performance.now();
  console.log('time3 = ', end - start)
}

// Use async and await but use a promise ALL to run them simultaneously
const readFiles4 = async () => {
  const start = performance.now();
  const [ data1, data2, data3, data4 ] =
    await Promise
      .all([
        read('file1'),
        read('file2'),
        read('file3'),
        read('file4'),
      ])

  console.log('file 1: ', data1.toString())
  console.log('file 2: ', data2.toString())
  console.log('file 3: ', data3.toString())
  console.log('file 4: ', data4.toString())
  const end = performance.now();
  console.log('time3 = ', end - start)
}

readFiles1();
setTimeout(() => {
  readFiles2();
},1000)
setTimeout(() => {
  readFiles3();
},2000)
setTimeout(() => {
  readFiles4();
},3000)

console.log('ending')
