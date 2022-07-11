// File: groov.js
//
require('dotenv').config();

const { readInputs } = require('./readInputs')
const mqttNode = require('./utils/mqttNode')
const msg      = require('./utils/msg')
const groov_api = require('./groov_api')

const f = "groov:main"

let clientName = process.env.CLIENT_NAME
if (process.argv[2]) {
  clientName = process.argv[2]
}

console.log ("Start ", clientName)

global.aaa = {
  clientName: clientName,
  project: 'lab1',
  mqtt: {
    url: process.env.MQTT_URL,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    connectTimeout: 4000,
    reconnectPeriod: 10000
  },
  subscribeTopics: {
    admin: `lab1/admin/config/${clientName}`
  }
}

/**
 * reqConfig() - Read in the configuration file for the groov
 */
const reqConfig = () => {
  const f = 'groov::reqConfig'

  const topic = `${global.aaa.project}/admin/configReq/${global.aaa.clientName}`
  const payloadStr = "{}"
  mqttNode.publish(topic, payloadStr)
  mqttNode.registerTopicCB(`${global.aaa.project}/admin/config/${global.aaa.clientName}`, loadClientConfigCB)
  msg(f,DEBUG,'exit')
}

const loadClientConfigCB = (topic, payload) => {
  const f = "index::loadClientConfigCB"
  msg(f, DEBUG, 'enter ', topic)

  global.aaa = JSON.parse(payload.toString())
  mqttNode.subscribe(global.aaa.subscribeTopics)

  for (let metricName in global.aaa.metrics) {
    // Register the metrics that have an output
    const metric = global.aaa.metrics[metricName]
    if (metric.output) {
      mqttNode.registerMetricCB(metricName, metricCB)
    }
  }

  startGroov()
}

/**
 * startGroov - all is loaded, let's get started
 */
const startGroov = () => {
  msg('groov::startGroov',DEBUG,'enter')
  readInputs();
}

const metricCB = (metric, topic, payload, tags, values) => {
  const f = "groov::metricCB"
  msg(f,DEBUG, "enter ", topic)

  let value;
  if (values.value === 'On') {
    value = true
  } else if (values.value === 'Off') {
    value = false
  } else if (values.value === '1') {
    value = true
  } else if (values.value === '0') {
    value = false
  }

  groov_api.writeChannel(metric.metricName, metric.output, `\{"value": ${value}\}`)
}
console.log(f,' - connect ')
mqttNode.connect(mqttNode.processCB);
console.log(f,' - requestConfig ')
reqConfig();
console.log(f,' - exit main thread ')
