import mqtt from 'precompiled-mqtt';
//import {extractFromTags} from './influx'
import {mgDebug, mgWarning, mgError} from './mg'
import {findMetric} from './metrics'
const extractFromTags = require('./influx')

let mqttClient;
let topicCB = {}

// Create the topic string from msgType, action, options
const mqttMakeTopic = (msgType, action, options) => {
//const f = "mqttCn::mqttMakeTopic"
  options = (options) ? options : {}
  const clientName = ("clientName" in options) ? options.clientName : global.aaa.name
  const telegraf = ("telegraf" in options) ? options.telegraf : ''
  let topic = global.aaa.project + '/' +
    msgType + '/' +
    action + '/' +
    clientName
  if (telegraf) {
    topic += '/' + telegraf
  }
  return topic
}

const onConnectPromise = (cb) => {
  const f = "mqttReact::onConnectPromise"
  mqttClient.on("error", (error) => {
    console.log(f, "MQTT Error - ", error)
  })
  return new Promise((resolve, reject) => {
    mqttClient.on('connect', (event) => {
      console.log(f,"connected ", mqttClient.connected)
//    mqttClient.unsubscribe(mc.subTopics, () => {})
      mqttClient.subscribe(global.aaa.subscribeTopics, () => {
        console.log(f, 'subscribed', global.aaa.subscribeTopics)
        mqttClient.on('message', cb);
      })
      resolve('connected')
    })
  })
}

const mqttConnect = (cb) => {
  topicCB = {};
  const f = 'mqttReact::mqttConnect'
  console.log(f, 'connect it up', global.aaa.mqtt.connectUrl)
  mqttClient = mqtt.connect(global.aaa.mqtt.connectUrl, {
//  clientId: global.aaa.mqtt.clientId,
    clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // create a random id
    clean: true,
    protocolId: 'MQTT',
    username: global.aaa.mqtt.username,
    password: global.aaa.mqtt.password,
    reconnectPeriod: global.aaa.mqtt.reconnectPeriod,
    connectTimeout: global.aaa.mqtt.connectTimeout,
  });
  console.log(f, 'connected it up', mqttClient.connected)

  mqttClient.on("error", (error) => {
    console.log(f, "MQTT Error - ", error)
  })

  console.log(f,'wait for the On event')
  onConnectPromise(cb)
  console.log(f,'we\'re on')

  mqttClient.subscribe(global.aaa.subscribeTopics.admin, () => {
    console.log(f, 'subscribed', global.aaa.subscribeTopics.admin)
  })

  mqttClient.on('message', cb);
  console.log(f,'exit')
}

const mqttConnected = () => {
  return (mqttClient && mqttClient.connected)
}

const mqttSubscribe = (topics) => {
  const f = "mqttReact::mqttSubscribe - "
  console.log(f, "enter ")
  for (let name in topics) {
    console.log(f, "topic: ", topics[name])
    mqttClient.subscribe(topics[name])
  }
}

const mqttUnsubscribe = (topics) => {
  const f = "mqttReact::mqttSubscribe - "
  console.log(f, "enter ")
  for (let name in topics) {
    console.log(f, "topic: ", topics[name])
    mqttClient.unsubscribe(topics[name]);
  }
}

const mqttPublish = (topic, payload) => {
  const f = "mqttReact::mqttPublish"
  if (!mqttClient.connected) {
    console.log(f, "ERROR: mqtt not connected")
  }
  const res = mqttClient.publish(topic, payload, {qos: 0, retain: false})
  return res
}

const mqttRegisterTopicCB = (topic, cb) => {
  const f = "mqttReact::mqttRegisterTopicCB"
  // If necessary intialize new topic
  mgDebug(f, "Register topic", topic)
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

const mqttUnregisterTopicCB = (topic, cb) => {
  const f = "mqttReact::mqttUnregisterTopicCB"
  for (let itopic in topicCB) {
    console.log(f, "   Check topic", itopic)
    if (topic === itopic) {
      console.log(f, "   Topic found", topicCB[itopic].length)
      // Execute the callbacks for this topic
      for (let rcb of topicCB[itopic]) {
        if (cb === rcb ) {
          topicCB[itopic].filter((item) => {return !item === cb} )
          break
        }
      }
    }
  }
}

const mqttRegisterMetricCB = (metricName, cb) => {
  const f = "mqttReact::mqttRegisterMetricCB"
  // If necessary intialize new metric
  const metric = global.aaa.metrics[metricName.toLowerCase()]
  console.log(f, 'enter')
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

const mqttUnregisterMetricCB = (metric, cb) => {
}

const mqttReqFile = (name, path, cb) => {
  let pubTopic = `${global.aaa.project}/admin/fileReq/${global.aaa.clientName}`
  let subTopic = `${global.aaa.project}/admin/file/${global.aaa.clientName}`

  const onLoadCB = (inTopic, inJson) => {
    const inPayload = JSON.parse(inJson);
    if (inPayload.name === name) {
      cb(inTopic, inPayload)
      mqttUnregisterTopicCB(subTopic, onLoadCB)
    }
  }
  mqttRegisterTopicCB(subTopic, onLoadCB)
  let payload = `{"path": "${path}"}`
  mqttPublish(pubTopic, payload)
}


const processInflux = (topic, payloadStr) => {
  const f = "mqttReact::processInflux"
  const msgType = topic.split("/")[1]
  const {tags, values} = extractFromTags(payloadStr)
  if (!tags["Metric"]) {
    mgError(f, "Could not find Metric field in influx string");
    return;
  } else {
    const metric = findMetric(tags["Metric"])
    if (metric == null) return;
    console.log(f, 'Metric found ', metric)

    switch (msgType) {
      case 'input':
        if (!metric.input) {
          mgWarning(f,'Metric does not have a input',metric.metricName)
        } else {
          metric.input.value = values.value
        }
        metric.value = values.value
        break;

      case 'output':
        if (!metric.output) {
//        mgWarning(f,'Metric does not have a output',metric.metricName)
        } else {
          metric.output.value = values.value
        }
        metric.value = values.value
        break;
      case 'user':
        if (!metric.user) {
          mgWarning(f,'Metric does not have a user',metric.metricName)
        } else {
          metric.user.value = values.value
        }
        break;
      default:
        mgError(f,'Unknown tags.msgType ', tags)
        return;
    }
    if (!metric.cbs) {
      mgDebug(f, "Metric does not have any registered Callbacks: ", metric.metricName);
      return;
    } else {
      for (let cb of metric.cbs) {
        cb(metric, topic, payloadStr, tags, values)
      }
    }
  }
}

const mqttProcessCB = (topic, payload) => {
  const f = 'mqttReact::mqttProcessCB'
  let payloadStr = payload.toString();
  console.log(f, 'enter ', topic, payloadStr)

  try {
    // If this is a metricCB - influx line buf - call metric callbacks
    if (topic.indexOf("/influx/") > -1) {
      processInflux(topic, payloadStr)
    }

//  console.log(f, "Look for topic", topic)
    for (let itopic in topicCB) {
      if (topic.indexOf(itopic) > -1) {
//      console.log(f, "   Topic found", topicCB[itopic].length)
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

export {
  mqttConnect,
  mqttConnected,
  mqttPublish,
  mqttSubscribe,
  mqttUnsubscribe,
  mqttRegisterMetricCB,
  mqttUnregisterMetricCB,
  mqttRegisterTopicCB,
  mqttUnregisterTopicCB,
  mqttMakeTopic,
  mqttProcessCB,
  mqttReqFile,
}