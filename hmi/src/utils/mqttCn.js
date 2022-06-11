const mqtt = require('mqtt');
const utils = require('util');

const msg = require('./msg');
require('./msgE')

const influx = require('./influx')

var requests = require('../configurator')
require('dotenv').config();

let mqttClient;

// Fill in variables in MQTT subscribe topics
const completeTopics = (config) => {
  const f = "mqttCn::completeTopics"
  for (let topicType in config.subscribeTopics) {
    let topic = config.subscribeTopics[topicType]
    config.subscribeTopics[topicType] = topic.
                  replace('PROJECT',global.cn.project).
                  replace('MY_CLIENT_NAME',config.name).
                  replace('MY_IP',  config.ip)
    msg(f,NOTIFY,'subscribe ', topic)
  }
}

// Create the topic string from msgType, action, options
const makeTopic = (msgType, action, options) => {
  const f = "mqttCn::makeTopic."
  options = (options) ? options : {}
  const clientName = ("clientName" in options) ? options.clientName : global.cn.name
  const telegraf = ("telegraf" in options) ? options.telegraf : ''
  let topic = global.cn.project + '/' +
    msgE[msgType] + '/' +
    action + '/' +
    clientName
  if (telegraf) {
    topic += '/' + telegraf
  }
  return topic
}


/**
 * connect - connect to the MQTT broker, set callback, subscribe to topics
 * @param cb
 */
const connect = (cb) => {
  const f = 'mqttCn:connect'
  const mc = global.cn.mqtt;
  msg(f, DEBUG, 'enter')
  mqttClient = mqtt.connect(mc.url, {
                        clientId: mc.clientId,
                        clean: true,
                        username: mc.username,
                        password: mc.password,
                        reconnectPeriod: mc.reconnectPeriod,
                        connectTimeout: mc.connectTimeout,
                      });
  mqttClient.on("connect", () => {
//  msg(f,DEBUG, "connected ", mqttClient.connected)
    for (topicType in global.cn.subscribeTopics) {
      const topic = global.cn.subscribeTopics[topicType]
//    msg(f, DEBUG, 'topic ', topic);
      mqttClient.subscribe(topic, () => {
//      msg(f,NOTIFY,'subscribed', topic)
      });
    }
  })

  mqttClient.on('message', cb);
  mqttClient.on("error", (error) => {
    msg(f,ERROR,"No Connected",error)
  })
}

const connected = () => {
  return (mqttClient && mqttClient.connected)
}

const subscribe = (cb) => {
  const f = "mqttCn::subscribe"
  msg(f,DEBUG, "mqtt subscribe ", mqttClient.connected)
  mqttClient.subscribe(topic, () => {
    msg(NOTIFY,f,'subscribed ', topic)
  }, 1000);
  msg(f,DEBUG, 'mqtt subscribe exit')
}

const send = (topic, payload) => {
  const res = mqttClient.publish(topic, payload, {qos: 0, retain: false})
};

/**
 * mqttRegisterClientCB - register callbacks by topic
 * @param topic
 * @param cb
 */
const mqttRegisterClientCB = (topic, cb) => {
  const f = "mqtt::mqttRegisterClientCB"
  // If necessary intialize new topic
  console.log(f, "Register topic", topic)
  if (!clientCB[topic]) {
    console.log(f, "Initialize topic", topic)
    clientCB[topic] = [];
  }
  for (let rcb in clientCB[topic]) {
    if (rcb === cb) {
      console.log(f, "Already added", topic)
      return;
    }
  }
  console.log(f, "add topic", topic)
  clientCB[topic].push(cb);
}

/**
 * mqttRegisterInfluxCB - register callback by metric name - Influx formatted payload
 * @param metric
 * @param cb
 */
const mqttRegisterInfluxCB = (metric, cb) => {
  const f = "mqtt::mqttRegisterInfluxCB"
  // If necessary intialize new metric
  metric = metric.toLowerCase()
  console.log(f, "enter ", metric)
  if (!influxCB[metric]) {
    influxCB[metric] = [cb];
  } else {
    for (let c = 0; c < influxCB[metric].length; c++) {
      if (influxCB[metric] === cb) {
        console.log(f, "    ++++ alreadyregistered ", metric)
        // already registered
      } else {
        console.log(f, "    ++++ registered ", metric)
        influxCB[metric].push(cb);
      }
    }
  }
}

const processCB = (topic, payload) => {
  const f = 'mqtt::processCB - '
  let payloadStr = payload.toString();
  console.log(f, 'enter ', topic, payloadStr)

  try {
    for (let itopic in callbacks) {
      if (topic.indexOf(itopic) > -1) {
        // Execute the callbacks for this topic
        for (let cb of callbacks[itopic]) {
          cb(topic,payloadStr)
        }
      }
    }
  } catch (err) {
    console.log(f, 'ERROR: ' + err)
  }
}

module.exports.connect =   connect
module.exports.connected = connected
module.exports.send =      send
module.exports.subscribe = subscribe
module.exports.completeTopics = completeTopics
module.exports.makeTopic = makeTopic
module.exports.mqttRegisterClientCB = mqttRegisterClientCB
module.exports.mqttRegisterInfluxCB = mqttRegisterInfluxCB
module.exports.processCB = processCB