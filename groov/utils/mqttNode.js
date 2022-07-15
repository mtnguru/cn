/**
 * File mqttNode.js
 */

const mqtt = require('mqtt');
//require('./msgE')
const msg = require('./msg')
const {extractFromTags} = require('./influx')
const {findMetric} = require('./metrics')
require('dotenv').config();


let mqttClient;
let topicCB = {}

// Fill in variables in MQTT subscribe topics
const completeTopics = (config) => {
  const f = "mqttNode::completeTopics"
  for (let topicType in config.subscribeTopics) {
    let topic = config.subscribeTopics[topicType]
    config.subscribeTopics[topicType] = topic.
    replace('PROJECT',global.aaa.project).
    replace('MY_CLIENT_NAME',config.clientName).
    replace('MY_IP',  config.ip)
    msg(f,DEBUG,'subscribe ', config.subscribeTopics[topicType])
  }
  for (let topicType in config.publishTopics) {
    let topic = config.publishTopics[topicType]
    config.publishTopics[topicType] = topic.
    replace('PROJECT',       global.aaa.project).
    replace('MY_CLIENT_NAME',config.clientName).
    replace('MY_IP',         config.ip).
    replace('TELEGRAF',      config.telegraf)
    msg(f,DEBUG,'publish ', config.publishTopics[topicType])
  }
}

// Create the topic string from msgType, action, options
const makeTopic = (msgType, action, options) => {
  const f = "mqttNode::makeTopic."
  options = (options) ? options : {}
  const clientName = ("clientName" in options) ? options.clientName : global.aaa.clientName
  const telegraf = ("telegraf" in options) ? options.telegraf : ''
  let topic = global.aaa.project + '/' +
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
const connect = (messageCB) => {
  const f = 'mqttNode:connect'
//msg(f,DEBUG, 'enter')
  const mc = global.aaa.mqtt;
  topicCB ={};

  const onConnectPromise = (messageCB) => {
    const f = "mqttNode::onConnectPromise"
    return new Promise((resolve, reject) => {
      mqttClient.on('connect', (event) => {
//      msg(f,NOTIFY,'Connected to MQTT broker')
//      mqttClient.unsubscribe((Object.values(global.aaa.subscribeTopics)), () => {})
        mqttClient.subscribe(Object.values(global.aaa.subscribeTopics), () => {
          mqttClient.on('message', (inTopic, payloadRaw) => {
//          msg(f,NOTIFY,'MQTT message received ', inTopic)
            messageCB(inTopic, payloadRaw)
          })
        })
        resolve('connected')
      })
    })
  }

  mqttClient = mqtt.connect(mc.url, {
                            clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
                            clean: true,
                            protocol: 'MQTT',
                            username: mc.username,
                            password: mc.password,
                            reconnectPeriod: mc.reconnectPeriod,
                            connectTimeout: mc.connectTimeout,
                          });
 console.log('connected it up')
 mqttClient.on("error", (error) => {
   console.log(f, "Not Connected", error)
 })

  console.log('wait for the On event')
  onConnectPromise(messageCB)
  console.log(f,'exit')
}

const connected = () => {
  return (mqttClient && mqttClient.connected)
}

const subscribe = (topics) => {
  const f = "mqttNode::subscribe"
//msg(f,DEBUG, "mqtt subscribe ", mqttClient.connected)
  for (let topic in topics) {
    mqttClient.subscribe(topics[topic])
  }
//msg(f,DEBUG, 'mqtt subscribe exit')
}

const unsubscribe = (topics) => {
  const f = "mqttNode::unsubscribe"
  msg(f,DEBUG, "mqtt unsubscribe ", mqttClient.connected)
  for (let topic in topics) {
    mqttClient.unsubscribe(topics[topic])
  }
  msg(f,DEBUG, 'mqtt unsubscribe exit')
}
const publish = (topic, payload) => {
  const res = mqttClient.publish(topic, payload, {qos: 0, retain: false})
};

/**
 * registerTopicCB - register callbacks by topic
 * @param topic
 * @param cb
 */
const registerTopicCB = (topic, cb) => {
  const f = "mqttNode::registerTopicCB"
  // If necessary intialize new topic
  console.log(f, "Register topic", topic)
  if (!topicCB[topic]) {
    console.log(f, "Initialize topic", topic)
    topicCB[topic] = [];
  }
  for (let rcb in topicCB[topic]) {
    if (rcb === cb) {
      console.log(f, "Already added", topic)
      return;
    }
  }
  console.log(f, "add topic", topic)
  topicCB[topic].push(cb);
}

/**
 * registerMetricCB - register callback by metric name - Influx formatted payload
 * @param metric
 * @param cb
 */
const registerMetricCB = (metricName, cb) => {
  const f = "mqttNode::registerMetricCB"
  // If necessary intialize new metric
  const metric = global.aaa.metrics[metricName.toLowerCase()]
  if (!metric) {
    mgError(f,'Cannot find metric ', metricName);
    return
  }
  if (metric.cbs) {
    if (metric.cbs.includes(cb)) {
      mgWarning.log(f, "already registered ", metricName)
    } else {
      metric.cbs.push(cb)
    }
  } else {
    metric.cbs = [cb]
  }
}

/**
 * processInflux
 *
 * Input, output, and user messaage all use Influx Line format.
 * This function breaks those down, finds the metric and value,
 * and acts accordingly.
 *
 * Outputs result in controlling a channel on the Edge device.
 *
 * @param topic
 * @param payloadStr
 */
const processInflux = (topic, payloadStr) => {
  const f = "mqttNode::processInflux"
  const msgType = topic.split("/")[1]
  const {tags, values} = extractFromTags(payloadStr)
  if (tags["Metric"]) {
    const metricName = tags["Metric"]
    const metric = findMetric(metricName)
    if (metric == null) {
      msg(f,ERROR, "Metric not found ",metricName);
    }
    console.log(f, 'Metric found ', metricName)

    switch (msgType) {
      case 'input':
        if (!metric.input) {
          msg(f,WARNING, 'Metric does not have a input',metric.metricName)
        } else {
          metric.input.value = values.value
        }
        metric.value = values.value
        break;
      case 'output':
        if (!metric.output) {
          msg(f, WARNING, 'Metric does not have a output',metric.metricName)
        } else {
          metric.output.value = values.value
        }
        metric.value = values.value
        break;
      case 'user':
        if (!metric.user) {
          msg(f, WARNING, 'Metric does not have a user',metric.metricName)
        } else {
          metric.user.value = values.value
        }
        break;
      default:
        msg(f,ERROR, 'Unknown tags.msgType ', tags)
        return;
    }
    if (!metric.cbs) {
      msg(f, DEBUG, "Metric does not have any callbacks: ", metric.metricName);
      return;
    }
    for (let cb of metric.cbs) {
//    console.log(f, '  ----- execute a callback')
      cb(metric, topic, payloadStr, tags, values)
    }
  } else {
    msg(f, ERROR, "Could not find Metric field in influx string");
  }
}

const processCB = (topic, payload) => {
  const f = 'mqttNode::processCB - '
  let payloadStr = payload.toString();
  console.log(f, 'enter ', topic)

  try {
    if (topic.indexOf("/influx/") > -1) {
      processInflux(topic, payloadStr)
    }
    for (let itopic in topicCB) {
      if (topic.indexOf(itopic) > -1) {
        // Execute the callbacks for this topic
        for (let cb of topicCB[itopic]) {
          cb(topic,payloadStr)
        }
      }
    }
  } catch (err) {
    console.log(f, 'ERROR: ' + err)
  }
}

/*
export {
  connect
  connected,
  publish,
  subscribe,
  unsubscribe,
  completeTopics,
  makeTopic,
  registerTopicCB,
  registerMetricCB,
  processCB,
}
*/

module.exports.connect =   connect
module.exports.connected = connected
module.exports.publish =   publish
module.exports.subscribe = subscribe
module.exports.unsubscribe = unsubscribe
module.exports.completeTopics = completeTopics
module.exports.makeTopic = makeTopic
module.exports.registerTopicCB = registerTopicCB
module.exports.registerMetricCB = registerMetricCB
module.exports.processCB = processCB
