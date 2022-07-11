//require('dotenv').config();
require('./msgE');
const mqttNode = require('./mqttNode');

let msgFlagsA = {
  ERROR: true,
  WARNING: true,
  DEBUG: true,
  NOTIFY: true,
  ADMIN: true,
  CONFIG: true,
  ALARM: true,
  CHAT: true,
  NOTES: true,
  USER: true,
  INPUT: true,
  OUTPUT: true,
  DOE: true
}

const msg = (func, msgType, ...snippets) => {
  let payload = {
    function: func,
//  program: global.aaa.program,
    msgType: msgE[msgType],
    content: snippets.join(' '),
  }
  const topic = mqttNode.makeTopic(msgType,"post")
  const jpayload = JSON.stringify(payload);
  if (mqttNode.connected()) {
    mqttNode.publish(topic, jpayload);
  }

  let type = msgE[msgType]
  if (msgType == ERROR) {
    type = '********** ERROR'
  } else if (msgType == ALARM) {
    type = '---------- ALARM'
  } else if (msgType == WARNING) {
    type = '!!!!!!!!!! WARNING'
  }
  console.log(type, func, ...snippets);
}

module.exports = msg
