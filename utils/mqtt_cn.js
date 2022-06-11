const mqtt = require('mqtt');
const util = require('util');
const cn_utils = require('./cn_util');

global

var requests = require('./requests')
require('dotenv').config();

const mc = {
  clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // create a random id
  connectUrl: 'mqtt://localhost:1883',
  username: 'data',
  password: 'datawp',
  connectTimeout: 4000,
  reconnectPeriod: 1000,
  subTopics: [
    'edge/input/#',
    'edge/config/request/#',
    'temp',
  ],
}

let client;

const connect = async (cb) => {
  const f = 'mqtt_cn:connect - '
  mqttClient = mqtt.connect(mc.connectUrl, {
                        clientId: mc.clientId,
                        clean: true,
                        username: mc.username,
                        password: mc.password,
                        reconnectPeriod: mc.reconnectPeriod,
                        connectTimeout: mc.connectTimeout,
                      });
  mqttClient.on("connect", () => {
    console.log(f,"connected ", mqttClient.connected)
    mqttClient.subscribe(mc.subTopics, () => {
      console.log(f,'subscribed', mc.subTopics)
      mqttClient.on('message', cb);
//    mqttClient.publish('edge/configReq','howdy')
    });
  })
  mqttClient.on("error", (error) => {
    cn_utils.pubErrorMsg(f,"No Connected",error)
  })
}

const connected = () => {
  return mqttClient.connected()
}

const subscribe = (cb) => {
  console.log(f,"mqtt subscribe ", mqttClient.connected)
  setTimeout(() => {
    mqttClient.on('message', cb);
  }, 1000);
  console.log(f,'mqtt subscribe exit')
}

const send = async (topic, payload) => {
  const res = await mqttClient.publish(topic,payload,{qos: 0, retain: false})
}

module.exports.connect =   connect
module.exports.send =      send
module.exports.subscribe = subscribe
module.exports.isConnected = isConnected