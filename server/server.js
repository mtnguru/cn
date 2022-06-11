// File: server.js

const fs = require('fs')
require('dotenv').config();

const f = "controller:main - "

// require cn modules
const mqttCn  = require('./utils/mqttCn');
const configurator = require('./configurator');

let data = fs.readFileSync(`${process.env.ROOT_PATH}/config/clients/server.json`)
global.cn = JSON.parse(data)
global.cn.mqtt.clientId = `server_${Math.random().toString(16).slice(3)}`
mqttCn.completeTopics(global.cn)

console.log(f, 'connect to mqtt server and submit start main thread')
mqttCn.connect(configurator.processCB,'-');
console.log(f, 'exit main thread')