//require('dotenv').config();
require('./msgE');
var mqttCn = require('./mqttCn');

let msgFlagsA = {
  debug: false,
  notifications: false,
  debug: false,
  debug: false,
  console: false,
}

const msg = (func, msgType, ...snippets) => {
  let payload = {
    function: func,
//  program: global.cn.program,
    msgType: msgE[msgType],
    content: snippets.join(' '),
  }
  const topic = mqttCn.makeTopic(msgType,"post")
  const jpayload = JSON.stringify(payload);
  if (mqttCn.connected()) {
    mqttCn.send(topic, jpayload);
  }

  let type = msgE[msgType]
  if (msgType == ERROR) {
    type = '********** ERROR'
  } else if (msgType == ALARM) {
    type = '---------- ALARM'
  } else if (msgType == WARNING) {
    type = '!!!!!!!!!! WARNING'
  }
  console.log(func, type, ...snippets);
}
module.exports = msg