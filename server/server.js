// File: server.js

const mqttNode = require('./utils/mqttNode');

const fs = require('fs')
require('dotenv').config();

const f = "server:main - "

// require cn modules
const configurator = require('./configurator');

let jsonStr = fs.readFileSync(`${process.env.ROOT_PATH}/config/clients/server.json`)
global.aaa = JSON.parse(jsonStr)
global.aaa.mqtt.clientId = `server_${Math.random().toString(16).slice(3)}`

// Read in ips of all clients
for (let clientName in global.aaa.clients) {
  let path = `${process.env.ROOT_PATH}/config/clients/${clientName}.json`
  console.log('Load client ', clientName)
  if (fs.existsSync(path)) {
    let json = fs.readFileSync(path)
    let data = JSON.parse(json)
    global.aaa.clients[clientName] = {
      clientName: clientName,
      ip: data.ip
    }
  } else {
    console.log('File does not exist - (okay if "all") ',path)
  }
}

mqttNode.completeTopics(global.aaa)

console.log(f, 'connect to mqtt server and submit start main thread')
mqttNode.connect(configurator.processCB,'-');
console.log(f, 'exit main thread')
