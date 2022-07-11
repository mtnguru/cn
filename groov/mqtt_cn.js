const mqtt = require('mqtt');
const util = require('util');
const requests = require('./requests')

let client;

let mqttConnect = util.promisify(mqtt.connect)

const connect = (device, topics, connectCB, messageCB) => {
  const f = 'mqtt_lt:connect - '
  console.log(f,'enter  device: ', device)
  let url = `mqtt://${process.env.MQTT_IP}:${process.env.MQTT_PORT}`
  let opt =
    {
      clientId: process.env.MQTT_CLIENT_ID,
      clean: true,
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASSWORD,
      reconnectPeriod: 1000,
      connectTimeout: 4000,
    };
//console.log(f,'url: ',url,'  opt: ',opt)
  // client = mqtt.connect(url,opt)
  client = mqtt.connect(url,opt)
  client.on("connect", () => {
    console.log(f, "connected ", client.connected)
    client.subscribe(topics, function() {
      console.log(f,'subscribed')
      connectCB();
    });
  })
  client.on('message', messageCB);
  client.on("error", (error) => {
    console.log(f, "NOT connected: ", error)
  })
  console.log(f,'exit')
}

const subscribe = (topics, cb) => {
  const f = 'mqtt_lt:subscribe - '
  client.subscribe(topics, function() {
    console.log(f,'subscribed')
  });
  client.on('message', cb);
  console.log(f,'exit')
}

/*
 * send - send a payload and topic on MQTT broker
 */
const send = async (topic, payload) => {
  const f = 'mqtt_lt:send - '
  console.log(f,'enter  topic: ',topic,'   payload: ', payload);
  const res = client.publish(topic,payload,{qos: 0, retain: false})
  console.log(f,'exit')
}

module.exports = { connect, subscribe, send }
