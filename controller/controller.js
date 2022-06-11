// File: controller.js
//

const fs = require('fs')

global.program = 'controller'

const f = "controller:main - "

// require cn modules
const cn_utils = require('./cn_util.js');
const mqtt_cn = require('./mqtt_cn');
const requests = require('./requests.js');

// require public libraries
require('dotenv').config();


// Read in the configuration for all devices, inputs, and output.
//const outputs = require(`${process.env.ROOT_PATH}/config/outputs.js`);
//const inputs  = require(`${process.env.ROOT_PATH}/config/inputs.js`);
//const hmi = require(`${process.env.ROOT_PATH}/config/hmi.js`);
//const devices = require(`${process.env.ROOT_PATH}/config/devices.js`);

let data;

data = fs.readFileSync(`${process.env.ROOT_PATH}/config/devices.json`)
const devices = JSON.parse(data)

data = fs.readFileSync(`${process.env.ROOT_PATH}/config/inputs.json`)
const inputs = JSON.parse(data)

data = fs.readFileSync(`${process.env.ROOT_PATH}/config/outputs.json`)
const outputs = JSON.parse(data)

data = fs.readFileSync(`${process.env.ROOT_PATH}/config/hmi.json`)
const hmi = JSON.parse(data)

global.config = {
   devices,
   outputs,
   inputs,
   hmi,
}

// Set topics array for the controller
subTopics = [ 'edge/input/#', 'edge/config/request/#' ]

console.log(f, 'connect to mqtt server and submit start main thread')
mqtt_cn.connect(requests.processCB);
console.log(f, 'end main thread')