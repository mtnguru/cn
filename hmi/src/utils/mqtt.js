import mqtt from 'precompiled-mqtt';
import {extract} from './influx.js'

const mc = {
  clientId: `mqtt_${Math.random().toString(16).slice(3)}`, // create a random id
  protocolId: 'MQTT',
  protocolVersion: 4,
  connectUrl: 'mqtt://merlin:8081',
  username: 'data',
  password: 'datawp',
  connectTimeout: 10000,
  reconnectPeriod: 120000,
  keepAlive: 5000,
  subTopics: [
    'lab1/#',
  ],
}

let mqttClient;
let clientCB = {}
let influxCB = {}

const onConnectPromise = (cb) => {
  const f = "mqtt::onConnectPromise"
  return new Promise((resolve, reject) => {
    mqttClient.on('connect', (event) => {
      console.log(f,"connected ", mqttClient.connected)
      mqttClient.unsubscribe(mc.subTopics, () => {})
      mqttClient.subscribe(mc.subTopics, () => {
        console.log(f, 'subscribed', mc.subTopics)
        mqttClient.on('message', cb);
      })
      resolve('connected')
    })
  })
}

const mqttConnect = (cb) => {
  clientCB = {};
  influxCB = {};
  const f = 'mqtt:connect - '
  console.log('connect it up')
  mqttClient = mqtt.connect(mc.connectUrl, {
    clientId: mc.clientId,
    clean: true,
    protocolId: 'MQTT',
    username: mc.username,
    password: mc.password,
    reconnectPeriod: mc.reconnectPeriod,
    connectTimeout: mc.connectTimeout,
  });
  console.log('connected it up')
  mqttClient.on("error", (error) => {
    console.log(f, "Not Connected", error)
  })

//const promiseA = new Promise((resolve, reject) => {
//})
  console.log('wait for on event')
  onConnectPromise(cb)
  console.log('done')
  console.log(f,'exit')
}

const mqttSubscribe = () => {

}

const mqttUnsubscribe = () => {

}

const mqttPublish = (topic, payload) => {
  mqttClient.publish(topic, payload, {qos: 0, retain: false})
}

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

const mqttProcessCB = (topic, payload) => {
  const f = 'mqtt::mqttProcessCB - '
  let payloadStr = payload.toString();
//console.log(f, 'enter ', topic, payloadStr)

  try {
//  console.log(f, "Look for topic", topic)
    for (let itopic in clientCB) {
//    console.log(f, "   Check topic", itopic)
      if (topic.indexOf(itopic) > -1) {
//      console.log(f, "   Topic found", clientCB[itopic].length)
        // Execute the callbacks for this topic
        for (let cb of clientCB[itopic]) {
//        console.log(f, "   Execute callback")
          cb(topic,payloadStr)
        }
      }
    }

    // If this is an influxCB input msg - callback registered callbacks
    if (topic.indexOf("/input/post/") > -1) {
      const {tags, values} = extract(payloadStr)
      if (tags["Metric"]) {
        const metric = tags.Metric.toLowerCase()
//      console.log(f, 'find metric callbacks ', metric)
        let cbs = influxCB[metric]
//      console.log(f, '    ----- execute a callback', cbs)
        if (cbs) {
          for (let cb of cbs) {
//          console.log(f, '    ----- execute a callback')
            cb(topic, payloadStr, tags, values)
          }
        } else {
//        console.log(f, "No callback registered:",metric);
        }
      } else {
        console.log(f, "Could not find Metric field in influx string");
      }
    }
  } catch (err) {
    console.log(f, 'ERROR: ' + err)
  }
}

export {
  mqttConnect,
  mqttPublish,
  mqttSubscribe,
  mqttUnsubscribe,
  mqttRegisterClientCB,
  mqttRegisterInfluxCB,
  mqttProcessCB}