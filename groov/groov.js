// File: groov.js
//

const f = 'groov:main - '
require ('dotenv').config();

const mqtt_cn = require('./mqtt_cn');
const { readInputs } = require('./readInputs')
const requests = require('./requests');

console.log(f, 'start main thread')

const getConfig = () => {
  const f = "groov:getConfig - "
  console.log(f,'enter  Get device configuration from CN')
  try {
    let topic = 'edge/configReq'
    let payload = `{"type":"config","deviceName":"${process.env.DEVICE_NAME}"}`
    mqtt_cn.send(topic, payload)
  } catch (err) {
    console.log(f,'ERROR: cannot get configuration\n', err, '\n')
  }
  console.log(f,'exit')
//readInputs();
}

const connectCB = () => {
  const f = "groov:connectCB - "
  console.log(f,'enter')
  getConfig()
  console.log(f,'exit')
}

const messageCB = (topic, payload) => {
  const f = "groov:messageCB - "
  console.log(f,'enter  topic: ', topic)
  requests.process(topic, payload)
  console.log(f,'exit')
}

let topics = [process.env.MQTT_TOPICS_CONFIG]
mqtt_cn.connect(process.env.DEVICE_NAME, topics, connectCB, messageCB)

console.log(f,'leave program thread')

